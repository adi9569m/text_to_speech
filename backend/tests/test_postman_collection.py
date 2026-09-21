import json
from pathlib import Path
import pytest
from backend.main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
POSTMAN_FILE = PROJECT_ROOT / "postman_collection.json"


def test_postman_file_exists():
    """Verify that postman_collection.json exists in the project root."""
    assert POSTMAN_FILE.exists(), "postman_collection.json not found in project root"


def test_postman_collection_structure():
    """Verify standard Postman Collection v2.1.0 schema compliance."""
    with open(POSTMAN_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "info" in data
    assert data["info"]["name"] == "VoiceFlow API"
    assert "v2.1.0" in data["info"]["schema"]

    # Check variables
    var_keys = [v["key"] for v in data.get("variable", [])]
    assert "baseUrl" in var_keys
    assert "authToken" in var_keys
    assert "sampleHistoryId" in var_keys

    # Check folders
    folders = [item["name"] for item in data.get("item", [])]
    assert any("Health" in f for f in folders)
    assert any("Voices" in f or "TTS" in f for f in folders)
    assert any("Document" in f for f in folders)
    assert any("Authentication" in f for f in folders)
    assert any("History" in f for f in folders)


def test_postman_covers_all_fastapi_endpoints():
    """Verify that all core FastAPI API routes are covered in the Postman collection."""
    with open(POSTMAN_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Flatten all requests in the collection
    collection_urls = []
    def extract_requests(items):
        for item in items:
            if "item" in item:
                extract_requests(item["item"])
            elif "request" in item:
                url_raw = item["request"]["url"]["raw"]
                collection_urls.append(url_raw)

    extract_requests(data.get("item", []))

    expected_routes = [
        "/api/health",
        "/api/voices",
        "/api/tts",
        "/api/extract-text",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/me",
        "/api/history",
    ]

    for route in expected_routes:
        matched = any(route in url for url in collection_urls)
        assert matched, f"Route '{route}' is missing from postman_collection.json"


def test_postman_includes_test_assertions():
    """Verify that requests have automated PM test assertions configured."""
    with open(POSTMAN_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    tests_found = 0
    def scan_tests(items):
        nonlocal tests_found
        for item in items:
            if "item" in item:
                scan_tests(item["item"])
            elif "event" in item:
                for ev in item.get("event", []):
                    if ev.get("listen") == "test":
                        script_lines = ev.get("script", {}).get("exec", [])
                        if any("pm.test" in line for line in script_lines):
                            tests_found += 1

    scan_tests(data.get("item", []))
    assert tests_found >= 8, f"Expected at least 8 requests with test scripts, found {tests_found}"


def test_postman_dynamic_auth_token_chaining():
    """Verify that login/register scripts chain the authToken variable."""
    with open(POSTMAN_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Convert to string or check decoded scripts
    all_scripts = []
    def extract_scripts(items):
        for item in items:
            if "item" in item:
                extract_scripts(item["item"])
            elif "event" in item:
                for ev in item.get("event", []):
                    script_lines = ev.get("script", {}).get("exec", [])
                    all_scripts.extend(script_lines)

    extract_scripts(data.get("item", []))
    combined_scripts = "\n".join(all_scripts)

    assert 'pm.collectionVariables.set("authToken"' in combined_scripts
    
    # Check that bearer header references {{authToken}}
    raw_text = json.dumps(data)
    assert 'Bearer {{authToken}}' in raw_text
