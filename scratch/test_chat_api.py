import requests
import json

base_url = "http://localhost:5555/api"
uid = "test-user-sidebar"

def test_sessions():
    print("--- Testing Fetch Sessions ---")
    r = requests.get(f"{base_url}/chat/{uid}")
    print(r.status_code, r.json())

    print("\n--- Testing Save Session ---")
    session_id = "session_12345"
    payload = {
        "session_id": session_id,
        "messages": [{"role": "user", "text": "Hello"}],
        "title": "Test Title"
    }
    r = requests.post(f"{base_url}/chat/{uid}", json=payload)
    print(r.status_code, r.json())

    print("\n--- Testing Fetch Specific Session ---")
    r = requests.get(f"{base_url}/chat/session/{session_id}")
    print(r.status_code, r.json())

if __name__ == "__main__":
    test_sessions()
