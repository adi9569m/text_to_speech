import logging
from datetime import timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.user import User
from backend.schemas.auth import (
    AuthResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from backend.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    clean_username = payload.username.strip()
    clean_name = payload.name.strip() if payload.name and payload.name.strip() else None
    if len(clean_username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters.",
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )

    # Check for existing username
    existing = db.query(User).filter(User.username.ilike(clean_username)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{clean_username}' is already registered.",
        )

    pwd_hash = hash_password(payload.password)
    new_user = User(username=clean_username, name=clean_name, password_hash=pwd_hash)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(user_id=new_user.id, username=new_user.username)
    display_label = new_user.name or new_user.username
    return {
        "success": True,
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "name": new_user.name,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else "",
        },
        "token": token,
        "message": f"Welcome, {display_label}! Account created successfully.",
    }


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Log in with username and password",
)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    clean_username = payload.username.strip()
    user = db.query(User).filter(User.username.ilike(clean_username)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_access_token(user_id=user.id, username=user.username)
    display_label = user.name or user.username
    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "created_at": user.created_at.isoformat() if user.created_at else "",
        },
        "token": token,
        "message": f"Welcome back, {display_label}!",
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get currently authenticated user details",
)
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "created_at": user.created_at.isoformat() if user.created_at else "",
    }
