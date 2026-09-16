from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from backend.models.database import Base


class User(Base):
    """
    User model for authentication and account management.
    Matches Section 17 (User Authentication) and Section 25 (Level 2) of the spec.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
