import requests
import json

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Test User"

def test_mood_save():
    print("Testing mood saving functionality...")
    
    # Step 1: Register or login user
    print("1. Attempting to login user...")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if login_response.status_code == 401:
        print("User not found, registering new user...")
        register_response = requests.post(f"{BASE_URL}/auth/register", json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if register_response.status_code != 200:
            print(f"Registration failed: {register_response.text}")
            return False
            
        login_data = register_response.json()
    elif login_response.status_code == 200:
        login_data = login_response.json()
        print("Login successful!")
    else:
        print(f"Login failed: {login_response.text}")
        return False
    
    access_token = login_data["access_token"]
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Test mood saving
    print("2. Testing mood save...")
    mood_data = {
        "mood_level": 4,
        "notes": "Feeling good today!",
        "context_tags": {"work": True, "personal": True}
    }
    
    mood_response = requests.post(f"{BASE_URL}/mood/", json=mood_data, headers=headers)
    
    if mood_response.status_code == 200:
        mood_result = mood_response.json()
        print("✅ Mood saved successfully!")
        print(f"Mood ID: {mood_result.get('id')}")
        print(f"Mood Level: {mood_result.get('mood_level')}")
        print(f"Notes: {mood_result.get('notes')}")
        print(f"Context Tags: {mood_result.get('context_tags')}")
        
        # Step 3: Test retrieving today's mood
        print("3. Testing mood retrieval...")
        today_response = requests.get(f"{BASE_URL}/mood/today", headers=headers)
        
        if today_response.status_code == 200:
            today_mood = today_response.json()
            print("✅ Today's mood retrieved successfully!")
            print(f"Retrieved mood level: {today_mood.get('mood_level')}")
            
            # Step 4: Test mood update
            print("4. Testing mood update...")
            updated_mood_data = {
                "mood_level": 5,
                "notes": "Actually feeling amazing now!",
                "context_tags": {"work": True, "personal": True, "social": True}
            }
            
            update_response = requests.post(f"{BASE_URL}/mood/", json=updated_mood_data, headers=headers)
            
            if update_response.status_code == 200:
                updated_result = update_response.json()
                print("✅ Mood updated successfully!")
                print(f"Updated mood level: {updated_result.get('mood_level')}")
                print(f"Updated notes: {updated_result.get('notes')}")
                return True
            else:
                print(f"❌ Mood update failed: {update_response.text}")
                return False
        else:
            print(f"❌ Mood retrieval failed: {today_response.text}")
            return False
    else:
        print(f"❌ Mood save failed: {mood_response.text}")
        print(f"Status code: {mood_response.status_code}")
        return False

if __name__ == "__main__":
    success = test_mood_save()
    if success:
        print("\n🎉 All mood functionality tests passed!")
    else:
        print("\n❌ Some tests failed. Check the error messages above.")
