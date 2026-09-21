import logging
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from backend.schemas.document import DocumentExtractResponse
from backend.services.document_service import DocumentService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/extract-text",
    response_model=DocumentExtractResponse,
    summary="Extract text from uploaded document (.txt, .pdf, .docx)",
    description="Accepts TXT, PDF, and DOCX documents, extracts text content, standardizes whitespace, and truncates to 1000 chars.",
)
@router.post(
    "/documents/extract",
    response_model=DocumentExtractResponse,
    include_in_schema=False,
)
async def extract_text(file: UploadFile = File(...)):
    """Extract and normalize text from an uploaded TXT, PDF, or DOCX document."""
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No document file provided for extraction.",
        )

    try:
        content = await file.read()
        return DocumentService.extract_text(filename=file.filename, content=content)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        logger.error(f"Error processing uploaded file '{file.filename}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract text from document.",
        )
