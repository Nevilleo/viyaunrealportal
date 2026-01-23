#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DigitalDeltaAPITester:
    def __init__(self, base_url="https://twin-vehicle-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.session_token = None
        self.test_user_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_health_check(self):
        """Test API health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["status", "database", "timestamp"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys and data.get("status") == "healthy"
                details = f"Status: {response.status_code}, Data: {data}" if success else f"Missing keys or wrong status: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Health Check", success, details)
            return success
            
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["status", "service", "version", "timestamp"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys and data.get("service") == "Digital Delta Platform"
                details = f"Status: {response.status_code}, Data: {data}" if success else f"Missing keys or wrong service: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("API Root", success, details)
            return success
            
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_contact_form_submission(self):
        """Test contact form submission"""
        try:
            contact_data = {
                "name": "Test User",
                "email": "test@example.com",
                "organization": "Test Organization",
                "message": "This is a test message for the Digital Delta Platform demo request."
            }
            
            response = requests.post(
                f"{self.api_url}/contact",
                json=contact_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["id", "name", "email", "message", "created_at", "status"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys and data.get("name") == contact_data["name"]
                details = f"Status: {response.status_code}, Contact ID: {data.get('id')}" if success else f"Missing keys: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Contact Form Submission", success, details)
            return success
            
        except Exception as e:
            self.log_test("Contact Form Submission", False, str(e))
            return False

    def test_contact_form_validation(self):
        """Test contact form validation with invalid data"""
        try:
            # Test with missing required fields
            invalid_data = {
                "name": "",  # Empty name
                "email": "invalid-email",  # Invalid email
                "message": "short"  # Too short message
            }
            
            response = requests.post(
                f"{self.api_url}/contact",
                json=invalid_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Should return 422 for validation error
            success = response.status_code == 422
            details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Contact Form Validation", success, details)
            return success
            
        except Exception as e:
            self.log_test("Contact Form Validation", False, str(e))
            return False

    def test_cesium_token_endpoint(self):
        """Test Cesium token endpoint"""
        try:
            response = requests.get(f"{self.api_url}/cesium/token", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_token = "token" in data and data["token"]
                success = has_token
                details = f"Status: {response.status_code}, Has token: {has_token}" if success else f"No token in response: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Cesium Token Endpoint", success, details)
            return success
            
        except Exception as e:
            self.log_test("Cesium Token Endpoint", False, str(e))
            return False

    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            user_data = {
                "email": "test@lcm.nl",
                "password": "test123456",
                "name": "Test User",
                "role": "veldwerker"
            }
            
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["user_id", "email", "name", "role", "created_at"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys and data.get("email") == user_data["email"]
                self.test_user_id = data.get("user_id")
                details = f"Status: {response.status_code}, User ID: {self.test_user_id}" if success else f"Missing keys: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("User Registration", success, details)
            return success
            
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False

    def test_user_login(self):
        """Test user login endpoint"""
        try:
            login_data = {
                "email": "test@lcm.nl",
                "password": "test123456"
            }
            
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["user", "session_token"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys and data.get("session_token")
                if success:
                    self.session_token = data.get("session_token")
                details = f"Status: {response.status_code}, Has session token: {bool(self.session_token)}" if success else f"Missing keys: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("User Login", success, details)
            return success
            
        except Exception as e:
            self.log_test("User Login", False, str(e))
            return False

    def test_get_assets(self):
        """Test get assets endpoint (requires authentication)"""
        try:
            if not self.session_token:
                self.log_test("Get Assets", False, "No session token available")
                return False
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.api_url}/assets",
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = isinstance(data, list)
                details = f"Status: {response.status_code}, Assets count: {len(data)}" if success else f"Invalid response format: {type(data)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Assets", success, details)
            return success
            
        except Exception as e:
            self.log_test("Get Assets", False, str(e))
            return False

    def test_get_alerts(self):
        """Test get alerts endpoint (requires authentication)"""
        try:
            if not self.session_token:
                self.log_test("Get Alerts", False, "No session token available")
                return False
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.api_url}/alerts",
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = isinstance(data, list)
                details = f"Status: {response.status_code}, Alerts count: {len(data)}" if success else f"Invalid response format: {type(data)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Alerts", success, details)
            return success
            
        except Exception as e:
            self.log_test("Get Alerts", False, str(e))
            return False

    def test_get_analytics_overview(self):
        """Test get analytics overview endpoint (requires authentication)"""
        try:
            if not self.session_token:
                self.log_test("Get Analytics Overview", False, "No session token available")
                return False
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.api_url}/analytics/overview",
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["total_assets", "active_alerts", "average_health_score", "status_distribution"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys
                details = f"Status: {response.status_code}, Analytics data: {data}" if success else f"Missing keys: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Analytics Overview", success, details)
            return success
            
        except Exception as e:
            self.log_test("Get Analytics Overview", False, str(e))
            return False

    def test_seed_database(self):
        """Test database seeding endpoint (requires authentication)"""
        try:
            if not self.session_token:
                self.log_test("Seed Database", False, "No session token available")
                return False
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.api_url}/seed",
                headers=headers,
                timeout=15
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["message", "assets", "alerts"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys and data.get("assets", 0) > 0
                details = f"Status: {response.status_code}, Seeded: {data.get('assets', 0)} assets, {data.get('alerts', 0)} alerts" if success else f"Missing keys: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Seed Database", success, details)
            return success
            
        except Exception as e:
            self.log_test("Seed Database", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Digital Delta Platform API Tests")
        print(f"Testing API at: {self.api_url}")
        print("-" * 60)
        
        # Run tests in order - authentication tests first
        tests = [
            self.test_health_check,
            self.test_api_root,
            self.test_user_registration,
            self.test_user_login,
            self.test_seed_database,
            self.test_get_assets,
            self.test_get_alerts,
            self.test_get_analytics_overview,
            self.test_contact_form_submission,
            self.test_contact_form_validation,
        ]
        
        for test in tests:
            test()
        
        print("-" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed!")
            return False

def main():
    tester = DigitalDeltaAPITester()
    success = tester.run_all_tests()
    
    # Save results for reporting
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open("/app/backend_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())