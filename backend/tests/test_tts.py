from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_get_voices():
    # Test GET /api/voices specified in project document
    response = client.get("/api/voices")
    assert response.status_code == 200

    data = response.json()
    assert "languages" in data
    assert "voices" in data
    assert len(data["voices"]) > 0


def test_generate_speech_success():
    # Test POST /api/tts specified in project document
    payload = {
        "text": "Hello, testing text to speech output.",
        "language": "en-US",
        "voice": "en-US-JennyNeural",
        "rate": "+0%",
        "pitch": "+0Hz",
    }
    response = client.post("/api/tts", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data.get("success") is True
    assert "audio_url" in data
    assert data["char_count"] == len(payload["text"])
    assert data["voice"] == "en-US-JennyNeural"

    # Verify that the generated file was saved to disk
    filename = data["filename"]
    audio_path = Path(__file__).resolve().parent.parent / "generated_audio" / filename
    assert audio_path.exists()
    assert audio_path.stat().st_size > 0

    # Clean up generated test file
    audio_path.unlink(missing_ok=True)


def test_generate_speech_validation():
    # Empty string should fail validation
    empty_res = client.post("/api/tts", json={"text": ""})
    assert empty_res.status_code == 422

    # Whitespace-only string should return 400
    spaces_res = client.post("/api/tts", json={"text": "   "})
    assert spaces_res.status_code == 400

    # Text over 1000 chars should fail validation
    long_res = client.post("/api/tts", json={"text": "a" * 1001})
    assert long_res.status_code == 422
