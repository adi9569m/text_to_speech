from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_speech_generation_persists_to_history():
    """Verify that generating speech automatically creates a history record."""
    # 1. Clear history before test to start clean
    clear_res = client.delete("/api/history")
    assert clear_res.status_code == 200

    # 2. History should be empty initially
    history_res = client.get("/api/history")
    assert history_res.status_code == 200
    data = history_res.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0

    # 3. Generate speech
    payload = {
        "text": "Testing history persistence for Day 3.",
        "language": "English (US)",
        "voice": "en-US-GuyNeural",
        "rate": "+0%",
        "pitch": "+0Hz",
    }
    gen_res = client.post("/api/tts", json=payload)
    assert gen_res.status_code == 200
    gen_data = gen_res.json()

    # 4. Check history now contains the synthesized speech
    history_res2 = client.get("/api/history")
    assert history_res2.status_code == 200
    data2 = history_res2.json()
    assert data2["total"] >= 1
    item = data2["items"][0]
    assert item["text"] == "Testing history persistence for Day 3."
    assert item["voice"] == "en-US-GuyNeural"
    assert item["audio_url"] == gen_data["audio_url"]
    assert "created_at" in item

    # Clean up generated audio file
    filename = gen_data["filename"]
    audio_path = Path(__file__).resolve().parent.parent / "generated_audio" / filename
    audio_path.unlink(missing_ok=True)


def test_delete_history_item():
    """Verify deleting a specific history item by ID."""
    # 1. Generate speech to ensure an item exists
    payload = {
        "text": "Temporary item to test single delete.",
        "language": "English (US)",
        "voice": "en-US-JennyNeural",
    }
    gen_res = client.post("/api/tts", json=payload)
    assert gen_res.status_code == 200

    # 2. Fetch history to get the item ID
    history_res = client.get("/api/history")
    items = history_res.json()["items"]
    assert len(items) > 0
    target_id = items[0]["id"]

    # 3. Delete the item
    del_res = client.delete(f"/api/history/{target_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 4. Attempting to delete the same ID again should return 404
    del_res404 = client.delete(f"/api/history/{target_id}")
    assert del_res404.status_code == 404


def test_clear_all_history():
    """Verify clearing all history records."""
    # 1. Ensure at least one item exists
    payload = {
        "text": "Item to be cleared in bulk.",
        "language": "English (US)",
        "voice": "en-US-JennyNeural",
    }
    client.post("/api/tts", json=payload)

    # 2. Call clear all endpoint
    clear_res = client.delete("/api/history")
    assert clear_res.status_code == 200
    assert clear_res.json()["success"] is True

    # 3. Confirm history is now empty
    history_res = client.get("/api/history")
    data = history_res.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0


def test_toggle_history_favorite():
    """Verify toggling favorite status and filtering by favorites (Day 5 feature)."""
    # 1. Generate speech
    payload = {
        "text": "Favorite item test for Day 5.",
        "language": "English (US)",
        "voice": "en-US-JennyNeural",
    }
    gen_res = client.post("/api/tts", json=payload)
    assert gen_res.status_code == 200

    # 2. Get the new item
    history_res = client.get("/api/history")
    items = history_res.json()["items"]
    target = items[0]
    assert target["is_favorite"] is False

    # 3. Toggle favorite ON
    fav_res = client.patch(f"/api/history/{target['id']}/favorite")
    assert fav_res.status_code == 200
    assert fav_res.json()["is_favorite"] is True

    # 4. Verify in history query with favorite_only=True
    fav_query_res = client.get("/api/history?favorite_only=true")
    assert fav_query_res.status_code == 200
    fav_items = fav_query_res.json()["items"]
    assert any(i["id"] == target["id"] for i in fav_items)

    # 5. Toggle favorite OFF
    unfav_res = client.patch(f"/api/history/{target['id']}/favorite")
    assert unfav_res.status_code == 200
    assert unfav_res.json()["is_favorite"] is False

    # 6. Verify 404 for invalid ID
    inv_res = client.patch("/api/history/999999/favorite")
    assert inv_res.status_code == 404

