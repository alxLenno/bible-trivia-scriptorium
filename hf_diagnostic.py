import requests
import time
import json

# Configuration
# Replace this with your actual Hugging Face Space URL if it changes
BASE_URL = "https://lennoxkk-trivia-model.hf.space"
API_ENDPOINT = f"{BASE_URL}/api/generate_trivia"

def test_endpoint():
    print(f"🚀 Starting Diagnostics for: {BASE_URL}")
    print("-" * 50)

    # 1. Connectivity Test (GET /)
    print("Test 1: Connection to Root...")
    try:
        start = time.time()
        res = requests.get(BASE_URL, timeout=30)
        end = time.time()
        print(f"✅ Root reachable in {end-start:.2f}s (Status: {res.status_code})")
    except Exception as e:
        print(f"❌ Root check failed: {e}")

    # 2. CORS Preflight Simulation
    print("\nTest 2: CORS Preflight Simulation...")
    try:
        cors_headers = {
            "Origin": "https://scriptorium-trivia-frontend1.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
        res = requests.options(API_ENDPOINT, headers=cors_headers, timeout=10)
        allow_origin = res.headers.get("Access-Control-Allow-Origin")
        print(f"✅ OPTIONS request returned: {res.status_code}")
        print(f"📡 Access-Control-Allow-Origin: {allow_origin}")
        if allow_origin in ["*", "https://scriptorium-trivia-frontend1.vercel.app"]:
            print("   👉 CORS looks correctly configured for your site.")
        else:
            print("   ⚠️ CORS might be missing or misconfigured.")
    except Exception as e:
        print(f"❌ CORS check failed: {e}")

    # 3. Functional Logic Test (POST /api/generate_trivia)
    print("\nTest 3: Trivia Generation Logic...")
    payload = {"prompt": "Generate 1 unique trivia question about the Book of Genesis."}
    try:
        start = time.time()
        res = requests.post(API_ENDPOINT, json=payload, timeout=30)
        end = time.time()
        
        if res.status_code == 200:
            data = res.json()
            if data.get("success"):
                print(f"✅ Logic successful in {end-start:.2f}s")
                print(f"📝 Sample Response: {data.get('response')[:100]}...")
            else:
                print(f"⚠️ API returned success=False. Error: {data.get('error')}")
        else:
            print(f"❌ API returned status code {res.status_code}")
            print(f"📄 Response Body: {res.text[:200]}")
    except Exception as e:
        print(f"❌ Logic test failed: {e}")

if __name__ == "__main__":
    test_endpoint()
