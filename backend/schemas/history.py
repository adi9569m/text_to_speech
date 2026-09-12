from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class AudioHistoryItem(BaseModel):
    id: int
    text: str
    language: Optional[str] = None
    voice: str
    audio_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AudioHistoryList(BaseModel):
    total: int
    items: List[AudioHistoryItem]


class HistoryDeleteResponse(BaseModel):
    success: bool
    message: str
