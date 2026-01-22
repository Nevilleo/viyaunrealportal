from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import bcrypt
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(
    title="Digital Delta Platform API",
    description="API for Rijkswaterstaat Digital Twin Platform",
    version="2.0.0"
)

api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ============== MODELS ==============

class UserRole:
    ADMIN = "admin"
    MANAGER = "manager"
    VELDWERKER = "veldwerker"

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str
    role: str = UserRole.VELDWERKER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str
    created_at: datetime

class SessionData(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime

class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    organization: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=10, max_length=2000)

class ContactResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    organization: Optional[str]
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"

class Asset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    asset_id: str = Field(default_factory=lambda: f"AST-{uuid.uuid4().hex[:8].upper()}")
    name: str
    type: str  # bridge, lock, barrier, road
    location: str
    latitude: float
    longitude: float
    status: str = "operational"  # operational, maintenance, warning, critical
    last_inspection: datetime
    next_maintenance: datetime
    health_score: int = Field(ge=0, le=100)
    sensors: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssetCreate(BaseModel):
    name: str
    type: str
    location: str
    latitude: float
    longitude: float
    status: str = "operational"
    health_score: int = 100

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    alert_id: str = Field(default_factory=lambda: f"ALR-{uuid.uuid4().hex[:8].upper()}")
    asset_id: str
    asset_name: str
    type: str  # predictive, warning, critical
    title: str
    description: str
    severity: str  # low, medium, high, critical
    status: str = "active"  # active, acknowledged, resolved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

class SensorReading(BaseModel):
    sensor_id: str
    asset_id: str
    type: str  # temperature, pressure, vibration, water_level
    value: float
    unit: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> UserResponse:
    """Extract and validate user from session token."""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    
    return UserResponse(**user)

def require_role(allowed_roles: List[str]):
    async def role_checker(user: UserResponse = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "role": user_data.role,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    del user_doc["password"]
    user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return UserResponse(**user_doc)

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    
    return {
        "user": UserResponse(**{k: v for k, v in user.items() if k != "password"}),
        "session_token": session_token
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent OAuth session_id for user data and session token."""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    
    oauth_data = resp.json()
    
    existing_user = await db.users.find_one({"email": oauth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": oauth_data["name"], "picture": oauth_data.get("picture")}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": oauth_data["email"],
            "name": oauth_data["name"],
            "picture": oauth_data.get("picture"),
            "role": UserRole.VELDWERKER,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    session_token = oauth_data.get("session_token", f"session_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    
    return {"user": UserResponse(**user), "session_token": session_token}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: UserResponse = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ============== ASSETS ENDPOINTS ==============

@api_router.get("/assets", response_model=List[Asset])
async def get_assets(user: UserResponse = Depends(get_current_user)):
    assets = await db.assets.find({}, {"_id": 0}).to_list(1000)
    for asset in assets:
        for field in ["last_inspection", "next_maintenance", "created_at"]:
            if isinstance(asset.get(field), str):
                asset[field] = datetime.fromisoformat(asset[field])
    return assets

@api_router.get("/assets/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str, user: UserResponse = Depends(get_current_user)):
    asset = await db.assets.find_one({"asset_id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    for field in ["last_inspection", "next_maintenance", "created_at"]:
        if isinstance(asset.get(field), str):
            asset[field] = datetime.fromisoformat(asset[field])
    return asset

@api_router.post("/assets", response_model=Asset)
async def create_asset(
    asset_data: AssetCreate,
    user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    asset = Asset(
        name=asset_data.name,
        type=asset_data.type,
        location=asset_data.location,
        latitude=asset_data.latitude,
        longitude=asset_data.longitude,
        status=asset_data.status,
        health_score=asset_data.health_score,
        last_inspection=datetime.now(timezone.utc),
        next_maintenance=datetime.now(timezone.utc) + timedelta(days=90)
    )
    
    doc = asset.model_dump()
    for field in ["last_inspection", "next_maintenance", "created_at"]:
        doc[field] = doc[field].isoformat()
    
    await db.assets.insert_one(doc)
    return asset

@api_router.put("/assets/{asset_id}", response_model=Asset)
async def update_asset(
    asset_id: str,
    asset_data: AssetCreate,
    user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    existing = await db.assets.find_one({"asset_id": asset_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset_data.model_dump()
    await db.assets.update_one({"asset_id": asset_id}, {"$set": update_data})
    
    updated = await db.assets.find_one({"asset_id": asset_id}, {"_id": 0})
    for field in ["last_inspection", "next_maintenance", "created_at"]:
        if isinstance(updated.get(field), str):
            updated[field] = datetime.fromisoformat(updated[field])
    return Asset(**updated)

@api_router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: str,
    user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.assets.delete_one({"asset_id": asset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted"}

# ============== ALERTS ENDPOINTS ==============

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(
    status: Optional[str] = None,
    user: UserResponse = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for alert in alerts:
        if isinstance(alert.get("created_at"), str):
            alert["created_at"] = datetime.fromisoformat(alert["created_at"])
        if alert.get("resolved_at") and isinstance(alert["resolved_at"], str):
            alert["resolved_at"] = datetime.fromisoformat(alert["resolved_at"])
    return alerts

@api_router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    user: UserResponse = Depends(get_current_user)
):
    result = await db.alerts.update_one(
        {"alert_id": alert_id},
        {"$set": {"status": "acknowledged", "acknowledged_by": user.user_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert acknowledged"}

@api_router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    result = await db.alerts.update_one(
        {"alert_id": alert_id},
        {"$set": {"status": "resolved", "resolved_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert resolved"}

# ============== SENSOR DATA ENDPOINTS ==============

@api_router.get("/sensors/{asset_id}/readings")
async def get_sensor_readings(
    asset_id: str,
    limit: int = 100,
    user: UserResponse = Depends(get_current_user)
):
    readings = await db.sensor_readings.find(
        {"asset_id": asset_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return readings

@api_router.get("/sensors/live/{asset_id}")
async def get_live_sensor_data(
    asset_id: str,
    user: UserResponse = Depends(get_current_user)
):
    """Get simulated live sensor data for an asset."""
    return {
        "asset_id": asset_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sensors": {
            "water_level": {
                "value": round(random.uniform(0.5, 3.5), 2),
                "unit": "m",
                "status": "normal"
            },
            "pressure": {
                "value": round(random.uniform(980, 1020), 1),
                "unit": "hPa",
                "status": "normal"
            },
            "temperature": {
                "value": round(random.uniform(8, 22), 1),
                "unit": "°C",
                "status": "normal"
            },
            "vibration": {
                "value": round(random.uniform(0.1, 2.5), 2),
                "unit": "mm/s",
                "status": "normal" if random.random() > 0.1 else "warning"
            },
            "wind_speed": {
                "value": round(random.uniform(5, 45), 1),
                "unit": "km/h",
                "status": "normal" if random.random() > 0.15 else "warning"
            }
        }
    }

# ============== ANALYTICS ENDPOINTS ==============

@api_router.get("/analytics/overview")
async def get_analytics_overview(user: UserResponse = Depends(get_current_user)):
    """Get dashboard overview analytics."""
    total_assets = await db.assets.count_documents({})
    active_alerts = await db.alerts.count_documents({"status": "active"})
    
    assets = await db.assets.find({}, {"_id": 0, "status": 1, "health_score": 1}).to_list(1000)
    
    status_counts = {"operational": 0, "maintenance": 0, "warning": 0, "critical": 0}
    total_health = 0
    for asset in assets:
        status_counts[asset.get("status", "operational")] += 1
        total_health += asset.get("health_score", 0)
    
    avg_health = round(total_health / total_assets, 1) if total_assets > 0 else 0
    
    return {
        "total_assets": total_assets,
        "active_alerts": active_alerts,
        "average_health_score": avg_health,
        "status_distribution": status_counts,
        "uptime_percentage": 99.7,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/analytics/maintenance-forecast")
async def get_maintenance_forecast(user: UserResponse = Depends(get_current_user)):
    """Get maintenance forecast for next 30 days."""
    now = datetime.now(timezone.utc)
    next_30_days = now + timedelta(days=30)
    
    assets = await db.assets.find({}, {"_id": 0}).to_list(1000)
    
    forecast = []
    for asset in assets:
        next_maintenance = asset.get("next_maintenance")
        if isinstance(next_maintenance, str):
            next_maintenance = datetime.fromisoformat(next_maintenance)
        if next_maintenance and next_maintenance.replace(tzinfo=timezone.utc) <= next_30_days:
            forecast.append({
                "asset_id": asset["asset_id"],
                "asset_name": asset["name"],
                "type": asset["type"],
                "scheduled_date": next_maintenance.isoformat() if isinstance(next_maintenance, datetime) else next_maintenance,
                "priority": "high" if asset.get("health_score", 100) < 70 else "normal"
            })
    
    return {"forecast": forecast, "total_scheduled": len(forecast)}

# ============== USERS MANAGEMENT (ADMIN) ==============

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: UserResponse = Depends(require_role([UserRole.ADMIN]))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for u in users:
        if isinstance(u.get("created_at"), str):
            u["created_at"] = datetime.fromisoformat(u["created_at"])
    return users

@api_router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    admin: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    if role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.VELDWERKER]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one({"user_id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Role updated"}

# ============== CONTACT & HEALTH ==============

@api_router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(contact: ContactRequest):
    contact_obj = ContactResponse(
        name=contact.name,
        email=contact.email,
        organization=contact.organization,
        message=contact.message
    )
    doc = contact_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_requests.insert_one(doc)
    return contact_obj

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/")
async def root():
    return {
        "status": "operational",
        "service": "Digital Delta Platform",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_database():
    """Seed database with demo data for Afsluitdijk infrastructure."""
    
    # Clear existing data
    await db.assets.delete_many({})
    await db.alerts.delete_many({})
    
    # Afsluitdijk assets
    assets_data = [
        {
            "asset_id": "AST-AFSLUIT01",
            "name": "Afsluitdijk - Hoofddam",
            "type": "barrier",
            "location": "Afsluitdijk, Friesland-Noord-Holland",
            "latitude": 52.9583,
            "longitude": 5.2536,
            "status": "operational",
            "health_score": 94,
            "sensors": ["water_level", "pressure", "vibration"],
            "last_inspection": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat(),
            "next_maintenance": (datetime.now(timezone.utc) + timedelta(days=45)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "asset_id": "AST-AFSLUIT02",
            "name": "Lorentzsluizen",
            "type": "lock",
            "location": "Kornwerderzand, Afsluitdijk",
            "latitude": 53.0747,
            "longitude": 5.3306,
            "status": "operational",
            "health_score": 88,
            "sensors": ["water_level", "pressure", "temperature"],
            "last_inspection": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
            "next_maintenance": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "asset_id": "AST-AFSLUIT03",
            "name": "Stevinsluizen",
            "type": "lock",
            "location": "Den Oever, Afsluitdijk",
            "latitude": 52.9347,
            "longitude": 5.0458,
            "status": "maintenance",
            "health_score": 72,
            "sensors": ["water_level", "pressure", "vibration", "temperature"],
            "last_inspection": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "next_maintenance": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "asset_id": "AST-AFSLUIT04",
            "name": "Afsluitdijk - Sector Noord",
            "type": "barrier",
            "location": "Afsluitdijk Noord",
            "latitude": 53.0200,
            "longitude": 5.2000,
            "status": "operational",
            "health_score": 91,
            "sensors": ["water_level", "wind_speed"],
            "last_inspection": (datetime.now(timezone.utc) - timedelta(days=20)).isoformat(),
            "next_maintenance": (datetime.now(timezone.utc) + timedelta(days=60)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "asset_id": "AST-AFSLUIT05",
            "name": "Afsluitdijk - Sector Zuid",
            "type": "barrier",
            "location": "Afsluitdijk Zuid",
            "latitude": 52.9000,
            "longitude": 5.1000,
            "status": "warning",
            "health_score": 78,
            "sensors": ["water_level", "pressure", "wind_speed"],
            "last_inspection": (datetime.now(timezone.utc) - timedelta(days=45)).isoformat(),
            "next_maintenance": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "asset_id": "AST-MAESLANT",
            "name": "Maeslantkering",
            "type": "barrier",
            "location": "Hoek van Holland",
            "latitude": 51.9547,
            "longitude": 4.0539,
            "status": "operational",
            "health_score": 96,
            "sensors": ["water_level", "pressure", "vibration", "temperature"],
            "last_inspection": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat(),
            "next_maintenance": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "asset_id": "AST-RDAM01",
            "name": "Erasmusbrug",
            "type": "bridge",
            "location": "Rotterdam",
            "latitude": 51.9099,
            "longitude": 4.4869,
            "status": "operational",
            "health_score": 89,
            "sensors": ["vibration", "temperature", "wind_speed"],
            "last_inspection": (datetime.now(timezone.utc) - timedelta(days=25)).isoformat(),
            "next_maintenance": (datetime.now(timezone.utc) + timedelta(days=35)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.assets.insert_many(assets_data)
    
    # Alerts
    alerts_data = [
        {
            "alert_id": "ALR-001",
            "asset_id": "AST-AFSLUIT05",
            "asset_name": "Afsluitdijk - Sector Zuid",
            "type": "predictive",
            "title": "Verhoogde slijtage gedetecteerd",
            "description": "Predictive analytics toont verhoogde slijtage aan de zuidelijke sectie. Inspectie aanbevolen binnen 7 dagen.",
            "severity": "medium",
            "status": "active",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat()
        },
        {
            "alert_id": "ALR-002",
            "asset_id": "AST-AFSLUIT03",
            "asset_name": "Stevinsluizen",
            "type": "warning",
            "title": "Gepland onderhoud nadert",
            "description": "Stevinsluizen heeft gepland onderhoud over 3 dagen. Voorbereidingen starten.",
            "severity": "low",
            "status": "acknowledged",
            "acknowledged_by": "system",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        },
        {
            "alert_id": "ALR-003",
            "asset_id": "AST-AFSLUIT02",
            "asset_name": "Lorentzsluizen",
            "type": "predictive",
            "title": "Drukval in hydraulisch systeem",
            "description": "Sensoren detecteren lichte drukdaling in het hydraulische systeem. Monitoring actief.",
            "severity": "medium",
            "status": "active",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        },
        {
            "alert_id": "ALR-004",
            "asset_id": "AST-AFSLUIT01",
            "asset_name": "Afsluitdijk - Hoofddam",
            "type": "warning",
            "title": "Hoge windsnelheden verwacht",
            "description": "Weersvoorspelling toont windsnelheden > 80 km/u voor de komende 24 uur.",
            "severity": "high",
            "status": "active",
            "created_at": (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
        }
    ]
    
    await db.alerts.insert_many(alerts_data)
    
    return {"message": "Database seeded successfully", "assets": len(assets_data), "alerts": len(alerts_data)}

# ============== APP SETUP ==============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
