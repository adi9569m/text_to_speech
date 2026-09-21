from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from backend.models.database import Base


class User(Base):
    """
    User model for authentication and account management.
    Stores full name, username, salted PBKDF2 password hash, and registration date.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
