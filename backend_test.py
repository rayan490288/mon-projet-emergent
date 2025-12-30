#!/usr/bin/env python3
"""
Backend API Testing for Brevet AI Application
Tests all endpoints including authentication, AI modules, and PDF generation
"""

import requests
import sys
import json
import base64
from datetime import datetime
from typing import Dict, Any, Optional

class BrevetAITester:
    def __init__(self, base_url="https://revise-brevet.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": name, "details": details})

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, files: Optional[Dict] = None) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                if files:
                    # For file uploads, don't set content-type header
                    response = self.session.post(url, data=data, files=files, headers=headers)
                else:
                    response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
                
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_health_endpoint(self):
        """Test API health endpoint"""
        success, response = self.make_request('GET', '/health')
        self.log_test("Health Endpoint", success, 
                     f"Status: {response.get('status', 'unknown')}")
        return success

    def test_subjects_endpoint(self):
        """Test subjects listing"""
        success, response = self.make_request('GET', '/subjects')
        has_subjects = success and 'subjects' in response
        self.log_test("Subjects Endpoint", has_subjects,
                     f"Found {len(response.get('subjects', {}))} subjects")
        return has_subjects

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        user_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test User",
            "school_type": "college_public",
            "academy": "Paris"
        }
        
        success, response = self.make_request('POST', '/auth/register', user_data, 200)
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
            
        self.log_test("User Registration", success,
                     f"Token received: {'Yes' if self.token else 'No'}")
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.token:
            return False
            
        # Test getting current user info
        success, response = self.make_request('GET', '/auth/me')
        self.log_test("User Authentication", success,
                     f"User: {response.get('name', 'unknown')}")
        return success

    def test_revision_ai(self):
        """Test revision AI module"""
        if not self.token:
            return False
            
        revision_data = {
            "subject": "mathematiques",
            "chapter": "Théorème de Pythagore",
            "request_type": "summary"
        }
        
        success, response = self.make_request('POST', '/ai/revision', revision_data)
        has_response = success and 'response' in response and len(response['response']) > 50
        
        self.log_test("Revision AI", has_response,
                     f"Response length: {len(response.get('response', ''))}")
        return has_response

    def test_training_ai(self):
        """Test training AI module"""
        if not self.token:
            return False
            
        training_data = {
            "subject": "francais",
            "chapter": "Grammaire",
            "exercise_type": "qcm",
            "difficulty": "medium",
            "count": 3
        }
        
        success, response = self.make_request('POST', '/ai/training', training_data)
        has_response = success and 'response' in response and len(response['response']) > 50
        
        self.log_test("Training AI", has_response,
                     f"Response length: {len(response.get('response', ''))}")
        return has_response

    def test_help_ai(self):
        """Test help AI module"""
        if not self.token:
            return False
            
        help_data = {
            "question": "Comment calculer l'aire d'un triangle?",
            "subject": "mathematiques",
            "detail_level": "simple",
            "guided_mode": False
        }
        
        success, response = self.make_request('POST', '/ai/help', help_data)
        has_response = success and 'response' in response and len(response['response']) > 20
        
        self.log_test("Help AI", has_response,
                     f"Response length: {len(response.get('response', ''))}")
        return has_response

    def test_literary_ai(self):
        """Test literary analysis AI"""
        if not self.token:
            return False
            
        literary_data = {
            "title": "Le Petit Prince",
            "author": "Antoine de Saint-Exupéry",
            "genre": "conte",
            "request_type": "summary"
        }
        
        success, response = self.make_request('POST', '/ai/literary', literary_data)
        has_response = success and 'response' in response and len(response['response']) > 50
        
        self.log_test("Literary AI", has_response,
                     f"Response length: {len(response.get('response', ''))}")
        return has_response

    def test_dictation_generate(self):
        """Test dictation generation"""
        if not self.token:
            return False
            
        dictation_data = {
            "dictation_type": "classic",
            "length": "short",
            "difficulty": "medium"
        }
        
        success, response = self.make_request('POST', '/ai/dictation/generate', dictation_data)
        has_response = success and 'response' in response and len(response['response']) > 30
        
        self.log_test("Dictation Generate", has_response,
                     f"Response length: {len(response.get('response', ''))}")
        return has_response

    def test_dictation_check(self):
        """Test dictation checking"""
        if not self.token:
            return False
            
        check_data = {
            "original_text": "Le chat mange sa pâtée.",
            "student_text": "Le chat mange sa patée."
        }
        
        success, response = self.make_request('POST', '/ai/dictation/check', check_data)
        has_response = success and 'response' in response and len(response['response']) > 20
        
        self.log_test("Dictation Check", has_response,
                     f"Response length: {len(response.get('response', ''))}")
        return has_response

    def test_brevet_method(self):
        """Test brevet method AI"""
        if not self.token:
            return False
            
        method_data = {
            "subject": "francais",
            "topic": "writing"
        }
        
        success, response = self.make_request('POST', '/ai/brevet-method', method_data)
        has_response = success and 'response' in response and len(response['response']) > 50
        
        self.log_test("Brevet Method", has_response,
                     f"Response length: {len(response.get('response', ''))}")
        return has_response

    def test_file_analysis(self):
        """Test file analysis AI"""
        if not self.token:
            return False
            
        # Create a simple text content encoded in base64
        test_content = "Ceci est un cours de mathématiques sur les fractions. Une fraction est un nombre qui représente une partie d'un tout."
        encoded_content = base64.b64encode(test_content.encode()).decode()
        
        analysis_data = {
            "content": encoded_content,
            "file_type": "text",
            "analysis_type": "summary"
        }
        
        success, response = self.make_request('POST', '/ai/analyze-file', analysis_data)
        has_response = success and 'response' in response and len(response['response']) > 20
        
        self.log_test("File Analysis", has_response,
                     f"Response length: {len(response.get('response', ''))}")
        return has_response

    def test_progress_logging(self):
        """Test progress logging"""
        if not self.token:
            return False
            
        progress_data = {
            "subject": "mathematiques",
            "activity_type": "revision",
            "score": 85.5,
            "details": {"chapter": "test", "duration": 300}
        }
        
        success, response = self.make_request('POST', '/progress', progress_data, 200)
        self.log_test("Progress Logging", success,
                     f"Progress ID: {response.get('id', 'none')}")
        return success

    def test_progress_stats(self):
        """Test progress statistics"""
        if not self.token:
            return False
            
        success, response = self.make_request('GET', '/progress/stats')
        has_stats = success and 'by_subject' in response
        
        self.log_test("Progress Stats", has_stats,
                     f"Total activities: {response.get('total_activities', 0)}")
        return has_stats

    def test_pdf_generation(self):
        """Test PDF generation"""
        if not self.token:
            return False
            
        # Use form data for PDF generation
        pdf_data = {
            'title': 'Test PDF',
            'content': 'Ceci est un test de génération PDF pour Brevet AI.',
            'pdf_type': 'fiche'
        }
        
        try:
            url = f"{self.api_url}/pdf/generate"
            headers = {'Authorization': f'Bearer {self.token}'}
            response = self.session.post(url, data=pdf_data, headers=headers)
            
            success = response.status_code == 200 and response.headers.get('content-type') == 'application/pdf'
            pdf_size = len(response.content) if success else 0
            
            self.log_test("PDF Generation", success,
                         f"PDF size: {pdf_size} bytes")
            return success
            
        except Exception as e:
            self.log_test("PDF Generation", False, f"Error: {str(e)}")
            return False

    def test_user_preferences(self):
        """Test user preferences update"""
        if not self.token:
            return False
            
        prefs_data = {
            "difficulty_level": "medium",
            "weak_subjects": ["mathematiques", "physique_chimie"],
            "objectives": ["brevet_preparation"]
        }
        
        success, response = self.make_request('PUT', '/auth/preferences', prefs_data)
        self.log_test("User Preferences", success,
                     f"Message: {response.get('message', 'none')}")
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Brevet AI Backend Tests")
        print(f"📍 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Basic connectivity tests
        self.test_health_endpoint()
        self.test_subjects_endpoint()
        
        # Authentication tests
        if self.test_user_registration():
            self.test_user_login()
            self.test_user_preferences()
            
            # AI module tests (require authentication)
            self.test_revision_ai()
            self.test_training_ai()
            self.test_help_ai()
            self.test_literary_ai()
            self.test_dictation_generate()
            self.test_dictation_check()
            self.test_brevet_method()
            self.test_file_analysis()
            
            # Progress and utility tests
            self.test_progress_logging()
            self.test_progress_stats()
            self.test_pdf_generation()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = BrevetAITester()
    
    try:
        all_passed = tester.run_all_tests()
        return 0 if all_passed else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())