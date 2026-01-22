from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="Digital Delta Platform API",
    description="API for Rijkswaterstaat Digital Twin Platform",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

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

class ApiHealth(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime

# Health check endpoint
@api_router.get("/", response_model=ApiHealth)
async def root():
    return ApiHealth(
        status="operational",
        service="Digital Delta Platform",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc)
    )

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Status endpoints
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Contact form endpoint
@api_router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(contact: ContactRequest):
    """
    Submit a contact form request for demo or information.
    """
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

@api_router.get("/contact", response_model=List[ContactResponse])
async def get_contact_requests():
    """
    Get all contact requests (admin endpoint).
    """
    requests = await db.contact_requests.find({}, {"_id": 0}).to_list(1000)
    
    for req in requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
    
    return requests

# Cesium token endpoint (for secure token delivery)
@api_router.get("/cesium/token")
async def get_cesium_token():
    """
    Get Cesium Ion access token.
    """
    token = os.environ.get('CESIUM_ION_TOKEN')
    if not token:
        raise HTTPException(status_code=500, detail="Cesium token not configured")
    
    return {"token": token}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
