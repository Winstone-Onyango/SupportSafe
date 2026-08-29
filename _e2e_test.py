"""End-to-end test of the SupportSafe system (Django :8000 + Next :3000)."""
import io
import requests

BACKEND = "http://127.0.0.1:8000"
FRONTEND = "http://localhost:3000"
results = []


def check(name, ok, detail=""):
    results.append((name, ok, str(detail)))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}  {('- ' + str(detail)[:250]) if detail else ''}")


# 1. Backend reachable
try:
    r = requests.get(f"{BACKEND}/get-admin-posts", timeout=30)
    check("Backend reachable (GET /get-admin-posts)", r.status_code == 200, f"status={r.status_code}")
except Exception as e:
    check("Backend reachable", False, e)

# 2. Login as admin (Winstone / Winstone-76)
token = None
try:
    r = requests.post(f"{BACKEND}/auth/login",
                      json={"username": "Winstone", "password": "Winstone-76"}, timeout=30)
    if r.status_code == 200:
        data = r.json()
        token = data.get("token")
        check("Admin login (Winstone/Winstone-76)", True, f"role={data.get('user', {}).get('role')}")
    else:
        check("Admin login (Winstone/Winstone-76)", False, f"status={r.status_code} {r.text[:150]}")
except Exception as e:
    check("Admin login (Winstone/Winstone-76)", False, e)

headers = {"Authorization": f"Bearer {token}"} if token else {}

# 3. /auth/me
try:
    r = requests.get(f"{BACKEND}/auth/me", headers=headers, timeout=30)
    check("GET /auth/me", r.status_code == 200, f"status={r.status_code}")
except Exception as e:
    check("GET /auth/me", False, e)

# 4. Text generation (Gemini + Gemma)
try:
    r = requests.post(f"{BACKEND}/text-generation",
                      json={"name": "Test User", "location": "Nairobi",
                            "current_situation": "I need help, I feel unsafe at home"},
                      timeout=90)
    ok = r.status_code == 200 and "gemini_response" in r.json()
    check("POST /text-generation", ok, f"status={r.status_code} {r.text[:120]}")
except Exception as e:
    check("POST /text-generation", False, e)

# 5. Text decomposition
try:
    r = requests.post(f"{BACKEND}/text-decomposition",
                      json={"text": "My name is John, I live in Kisumu and my neighbour threatens me daily."},
                      timeout=90)
    check("POST /text-decomposition", r.status_code == 200, f"status={r.status_code} {r.text[:120]}")
except Exception as e:
    check("POST /text-decomposition", False, e)

# 6. Poem generation (GET)
try:
    r = requests.get(f"{BACKEND}/poem-generation", params={"text": "hope and strength"}, timeout=90)
    ok = r.status_code == 200 and r.json().get("poem")
    check("GET /poem-generation", ok, f"status={r.status_code} {r.text[:100]}")
except Exception as e:
    check("GET /poem-generation", False, e)

# 7. Generate image (the endpoint that was erroring in the UI)
try:
    r = requests.post(f"{BACKEND}/generate-image",
                      json={"prompt": "a hopeful sunrise over mountains"}, timeout=180)
    if r.status_code == 200:
        urls = r.json().get("image_urls", [])
        check("POST /generate-image", len(urls) > 0, f"{len(urls)} image url(s)")
    else:
        check("POST /generate-image", False, f"status={r.status_code} {r.text[:250]}")
except Exception as e:
    check("POST /generate-image", False, e)

# 8. Steganography encode -> returns PNG bytes
encoded_png = None
try:
    r = requests.post(f"{BACKEND}/encode", params={"text": "secret-help-msg"}, timeout=60)
    if r.status_code == 200 and r.headers.get("Content-Type") == "image/png":
        encoded_png = r.content
        check("POST /encode", True, f"{len(encoded_png)} bytes PNG")
    else:
        check("POST /encode", False, f"status={r.status_code} {r.text[:150]}")
except Exception as e:
    check("POST /encode", False, e)

# 9. Steganography decode (round-trip)
try:
    if encoded_png:
        r = requests.post(f"{BACKEND}/decode",
                          files={"file": ("encoded.png", io.BytesIO(encoded_png), "image/png")},
                          timeout=60)
        decoded = r.json().get("decoded_text", "") if r.status_code == 200 else ""
        check("POST /decode (round-trip)", decoded == "secret-help-msg", f"decoded='{decoded[:60]}'")
    else:
        check("POST /decode (round-trip)", False, "encode failed, skipped")
except Exception as e:
    check("POST /decode (round-trip)", False, e)

# 10. Save extracted data (create a post)
try:
    payload = {
        "name": "Test Survivor",
        "location": "Nairobi, Kenya",
        "abuse_type": "verbal abuse",
        "description": "End-to-end automated test post",
        "culprit": "a tall man in a blue jacket",
        "relation": "acquaintance",
        "image": "",
        "lat": -1.286389,
        "lng": 36.817223,
        "status": "open",
    }
    r = requests.post(f"{BACKEND}/save-extracted-data", json=payload, headers=headers, timeout=30)
    check("POST /save-extracted-data", r.status_code == 200, f"status={r.status_code} {r.text[:120]}")
except Exception as e:
    check("POST /save-extracted-data", False, e)

# 11. Get admin posts (should include the new post)
try:
    r = requests.get(f"{BACKEND}/get-admin-posts", headers=headers, timeout=30)
    ok = r.status_code == 200
    n = len(r.json()) if ok else 0
    check("GET /get-admin-posts", ok and n > 0, f"status={r.status_code} posts={n}")
except Exception as e:
    check("GET /get-admin-posts", False, e)

# 12. Find match (MongoDB vector search)
try:
    r = requests.get(f"{BACKEND}/find-match",
                     params={"info": "a tall man in a blue jacket"}, headers=headers, timeout=90)
    check("GET /find-match (vector search)", r.status_code == 200, f"status={r.status_code} {r.text[:150]}")
except Exception as e:
    check("GET /find-match (vector search)", False, e)

# 13. Frontend -> Gemini chat proxy (lawbot path)
try:
    r = requests.post(f"{FRONTEND}/api/chat",
                      json={"userInput": "Say 'test ok' and nothing else."},
                      headers={"Content-Type": "application/json"}, timeout=90)
    ok = r.status_code == 200 and len(r.text) > 2
    check("POST frontend /api/chat (lawbot LLM)", ok, f"status={r.status_code} {r.text[:120]}")
except Exception as e:
    check("POST frontend /api/chat (lawbot LLM)", False, e)

# 14. Frontend -> backend image proxy (reproduces the UI error path)
try:
    r = requests.post(f"{FRONTEND}/api/generate-image",
                      json={"generatedText": "test", "imagePrompt": "a calm ocean at dawn"},
                      headers={"Content-Type": "application/json"}, timeout=180)
    if r.status_code == 200:
        imgs = r.json().get("images", [])
        check("POST frontend /api/generate-image (proxy)", len(imgs) > 0, f"{len(imgs)} image(s)")
    else:
        check("POST frontend /api/generate-image (proxy)", False, f"status={r.status_code} {r.text[:250]}")
except Exception as e:
    check("POST frontend /api/generate-image (proxy)", False, e)

# 15. Frontend reachable
try:
    r = requests.get(FRONTEND, timeout=30)
    check("Frontend reachable (GET /)", r.status_code == 200, f"status={r.status_code}")
except Exception as e:
    check("Frontend reachable (GET /)", False, e)

print("\n==== SUMMARY ====")
passed = sum(1 for _, ok, _ in results if ok)
print(f"{passed}/{len(results)} passed")
for name, ok, detail in results:
    if not ok:
        print(f"  FAILED: {name}\n          {detail[:400]}")
