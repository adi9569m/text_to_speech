import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_error_empty_text():
    """PDF Section 18: Empty text should return 422 Unprocessable Entity."""
    response = client.post("/api/tts", json={"text": ""})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


def test_error_whitespace_only_text():
    """PDF Section 18: Whitespace-only text should return 400 Bad Request."""
    response = client.post("/api/tts", json={"text": "     \n\t  "})
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "provide some text" in data["detail"].lower()


def test_error_exceeds_max_length():
    """PDF Section 18: Text > 1000 characters should return 422 Unprocessable Entity."""
    long_text = "x" * 1001
    response = client.post("/api/tts", json={"text": long_text})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


def test_error_invalid_voice():
    """PDF Section 18: Requesting an unsupported voice should return 400 Bad Request."""
    response = client.post(
        "/api/tts",
        json={
            "text": "Testing error response for invalid voice.",
            "voice": "invalid-voice-id-that-does-not-exist",
        },
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "invalid voice" in data["detail"].lower()


def test_error_delete_nonexistent_history():
    """PDF Section 18: Deleting non-existent history record should return 404 Not Found."""
    response = client.delete("/api/history/99999999")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


def test_error_favorite_nonexistent_history():
    """PDF Section 18: Toggling favorite on non-existent history record should return 404 Not Found."""
    response = client.patch("/api/history/99999999/favorite")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


def test_error_nonexistent_route():
    """PDF Section 18: Accessing an invalid route should return 404 Not Found."""
    response = client.get("/api/invalid_endpoint_does_not_exist")
    assert response.status_code == 404


def test_error_method_not_allowed():
    """PDF Section 18: Using an incorrect HTTP method should return 405 Method Not Allowed."""
    # /api/tts is POST only
    response = client.get("/api/tts")
    assert response.status_code == 405
