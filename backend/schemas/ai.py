from typing import List
from pydantic import BaseModel, Field


class AIEnhanceRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Input text to enhance")
    mode: str = Field(
        default="grammar",
        description="Enhancement mode: 'grammar', 'summarize', 'conversational', 'formal', or 'bullet_to_script'",
    )


class AIEnhanceResponse(BaseModel):
    success: bool
    mode: str
    original_text: str
    enhanced_text: str
    char_count: int
    word_count: int
    changes_applied: List[str]
