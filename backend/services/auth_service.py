import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.user import User

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "tts-intermediate-secret-key-2026-auth")


def hash_password(password: str) -> str:
    """Hash password securely using PBKDF2-HMAC-SHA256 with random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100000,
    )
    return f"{salt}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored salt$hash string."""
    try:
        salt, key_hex = stored_hash.split("$", 1)
        expected = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations=100000,
        ).hex()
        return hmac.compare_digest(key_hex, expected)
    except Exception:
        return False


def create_access_token(user_id: int, username: str, expires_in_seconds: int = 86400 * 7) -> str:
    """Create a signed, base64 URL-safe token containing user ID and expiration."""
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": int(time.time()) + expires_in_seconds,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    sig = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload_b64}.{sig}"


def verify_access_token(token: str) -> Optional[dict]:
    """Verify token signature and expiration, returning decoded payload or None."""
    try:
        if not token or "." not in token:
            return None
        payload_b64, sig = token.split(".", 1)
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None

        pad = len(payload_b64) % 4
        if pad:
            payload_b64 += "=" * (4 - pad)
        decoded = base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8")
        payload = json.loads(decoded)

        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def get_optional_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Extract authenticated user if Authorization Bearer header is provided; otherwise None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    payload = verify_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == payload.get("user_id")).first()


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Enforce authentication, raising HTTP 401 if token is missing or invalid."""
    user = get_optional_user(authorization=authorization, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in or provide a valid token.",
        )
    return user
