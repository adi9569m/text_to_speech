from pydantic import BaseModel, Field


class DocumentExtractResponse(BaseModel):
    success: bool = Field(True, description="Extraction success status")
    text: str = Field(..., description="Extracted and normalized text content")
    filename: str = Field(..., description="Name of the processed file")
    char_count: int = Field(..., description="Number of characters in the returned text")
    page_count: int = Field(..., description="Number of pages in document (1 for TXT)")
    truncated: bool = Field(False, description="True if text was truncated to fit character limit")
