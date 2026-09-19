from pathlib import Path
from fastapi.testclient import TestClient
import pytest
from backend.main import app, AUDIO_DIR

client = TestClient(app)


@pytest.fixture
def sample_audio_file():
    """Create a temporary dummy mp3 file for streaming tests."""
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    temp_file = AUDIO_DIR / "test_stream_audio.mp3"
    temp_file.write_bytes(b"ID3\x03\x00\x00\x00\x00\x00\x00" + b"\xff\xfb\x90\x00" * 100)
    yield temp_file.name
    if temp_file.exists():
        temp_file.unlink()


def test_stream_audio_success(sample_audio_file):
    """Test GET /api/audio/{filename} returns 200 with audio/mpeg and Accept-Ranges."""
    response = client.get(f"/api/audio/{sample_audio_file}")
    assert response.status_code == 200
    assert "audio/mpeg" in response.headers.get("content-type", "")
    assert response.headers.get("accept-ranges") == "bytes"
    assert len(response.content) > 0


def test_stream_audio_not_found():
    """Test GET /api/audio/{filename} returns 404 for missing files."""
    response = client.get("/api/audio/completely_nonexistent_audio_9999.mp3")
    assert response.status_code == 404
    assert "not found" in response.json().get("detail", "").lower()


def test_stream_audio_path_traversal_protection():
    """Test that path traversal attempts are neutralized and return 404."""
    response = client.get("/api/audio/..%2F..%2Fmain.py")
    assert response.status_code == 404


def test_tts_response_includes_audio_metadata():
    """Verify that speech synthesis returns audio_format and file_size_bytes."""
    payload = {
        "text": "Testing audio return metadata for Day 11.",
        "voice": "en-US-JennyNeural",
        "rate": "+0%",
        "pitch": "+0Hz",
        "volume": "+0%",
    }
    response = client.post("/api/tts", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["audio_format"] == "mp3"
    assert "file_size_bytes" in data
    assert isinstance(data["file_size_bytes"], int)
    assert data["file_size_bytes"] > 0
