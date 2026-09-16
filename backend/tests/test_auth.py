import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_user_register_success():
    """Verify successful user registration."""
    unique_user = f"user_{uuid.uuid4().hex[:8]}"
    payload = {
        "username": unique_user,
        "password": "securepassword123",
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["username"] == unique_user
    assert "id" in data["user"]


def test_user_register_validation():
    """Verify register rejects invalid inputs and duplicate usernames."""
    # Password too short (< 6 chars) -> 422 Unprocessable Entity
    res_short_pwd = client.post(
        "/api/auth/register",
        json={"username": "validname", "password": "123"},
    )
    assert res_short_pwd.status_code == 422

    # Username too short (< 3 chars) -> 422 Unprocessable Entity
    res_short_name = client.post(
        "/api/auth/register",
        json={"username": "ab", "password": "validpassword123"},
    )
    assert res_short_name.status_code == 422

    # Duplicate username
    dup_user = f"dup_{uuid.uuid4().hex[:8]}"
    client.post(
        "/api/auth/register",
        json={"username": dup_user, "password": "password123"},
    )
    res_dup = client.post(
        "/api/auth/register",
        json={"username": dup_user, "password": "differentpassword"},
    )
    assert res_dup.status_code == 400
    assert "already registered" in res_dup.json()["detail"].lower()


def test_user_login():
    """Verify user login with valid and invalid credentials."""
    username = f"login_{uuid.uuid4().hex[:8]}"
    password = "secretpassword123"

    # Register user first
    reg_res = client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )
    assert reg_res.status_code == 201

    # Login with correct credentials
    login_res = client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert "token" in login_data
    token = login_data["token"]

    # Verify /api/auth/me works with Bearer token
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["username"] == username

    # Login with wrong password
    bad_pwd_res = client.post(
        "/api/auth/login",
        json={"username": username, "password": "wrongpassword"},
    )
    assert bad_pwd_res.status_code == 401

    # Login with non-existent username
    bad_user_res = client.post(
        "/api/auth/login",
        json={"username": "nonexistent_user_xyz", "password": password},
    )
    assert bad_user_res.status_code == 401


def test_auth_me_unauthorized():
    """Verify /api/auth/me returns 401 when token is missing or invalid."""
    # No token
    res_no_token = client.get("/api/auth/me")
    assert res_no_token.status_code == 401

    # Invalid token
    res_bad_token = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.token.payload"},
    )
    assert res_bad_token.status_code == 401


def test_user_history_scoping():
    """Verify speech history is isolated per authenticated user."""
    user1_name = f"user1_{uuid.uuid4().hex[:8]}"
    user2_name = f"user2_{uuid.uuid4().hex[:8]}"

    # Register User 1
    u1_res = client.post(
        "/api/auth/register",
        json={"username": user1_name, "password": "password123"},
    )
    u1_token = u1_res.json()["token"]

    # Register User 2
    u2_res = client.post(
        "/api/auth/register",
        json={"username": user2_name, "password": "password123"},
    )
    u2_token = u2_res.json()["token"]

    # User 1 generates audio
    gen1 = client.post(
        "/api/tts",
        json={"text": "User 1 exclusive audio text."},
        headers={"Authorization": f"Bearer {u1_token}"},
    )
    assert gen1.status_code == 200

    # User 2 generates audio
    gen2 = client.post(
        "/api/tts",
        json={"text": "User 2 exclusive audio text."},
        headers={"Authorization": f"Bearer {u2_token}"},
    )
    assert gen2.status_code == 200

    # User 1 checks history: should only see User 1's audio
    h1 = client.get(
        "/api/history",
        headers={"Authorization": f"Bearer {u1_token}"},
    )
    assert h1.status_code == 200
    texts1 = [item["text"] for item in h1.json()["items"]]
    assert "User 1 exclusive audio text." in texts1
    assert "User 2 exclusive audio text." not in texts1

    # User 2 checks history: should only see User 2's audio
    h2 = client.get(
        "/api/history",
        headers={"Authorization": f"Bearer {u2_token}"},
    )
    assert h2.status_code == 200
    texts2 = [item["text"] for item in h2.json()["items"]]
    assert "User 2 exclusive audio text." in texts2
    assert "User 1 exclusive audio text." not in texts2
