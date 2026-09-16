from pydantic import BaseModel, Field
from typing import Optional


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username (3-50 chars)")
    password: str = Field(..., min_length=6, max_length=100, description="Account password (min 6 chars)")


class UserLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Account username")
    password: str = Field(..., min_length=1, description="Account password")


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: str
    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    success: bool = True
    user: UserResponse
    token: str
    message: str
