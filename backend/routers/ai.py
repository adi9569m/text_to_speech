import logging
from fastapi import APIRouter, HTTPException, status
from backend.schemas.ai import AIEnhanceRequest, AIEnhanceResponse
from backend.services.ai_service import AIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Enhancement"])


@router.post(
    "/enhance",
    response_model=AIEnhanceResponse,
    summary="Enhance text using AI (summarize, grammar, conversational, formal, bullet_to_script)",
    description="Transforms and prepares text for speech synthesis with grammar corrections and stylistic adjustments.",
)
async def enhance_text(payload: AIEnhanceRequest):
    try:
        return AIService.enhance_text(text=payload.text, mode=payload.mode)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        logger.error(f"Error in AI text enhancement: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enhance text.",
        )
