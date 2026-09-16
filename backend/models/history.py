from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from backend.models.database import Base


class AudioHistory(Base):
    """
    AudioHistory model for storing past speech generations.
    Matches Section 17 & 25 of the project specification:
    - Text
    - Language
    - Voice
    - Audio URL
    - Created At
    - Favorites (Day 5 feature)
    """
    __tablename__ = "audio_history"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    language = Column(String(50), nullable=True)
    voice = Column(String(100), nullable=False)
    audio_url = Column(String(255), nullable=False)
    is_favorite = Column(Boolean, default=False, nullable=False)
    user_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

