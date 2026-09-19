from typing import List, Optional
from pydantic import BaseModel, Field


class TTSGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    language: Optional[str] = "en-US"
    voice: str = "en-US-JennyNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"
    volume: str = "+0%"


class TTSGenerateResponse(BaseModel):
    success: bool = True
    audio_url: str
    filename: str
    voice: str
    text_length: int
    char_count: int
    word_count: int
    file_size_bytes: Optional[int] = None
    audio_format: Optional[str] = "mp3"
    created_at: str


class VoiceItem(BaseModel):
    id: str
    name: str
    gender: str
    locale: str
    language: str


class VoicesResponse(BaseModel):
    languages: List[str]
    voices: List[VoiceItem]
