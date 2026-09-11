import logging
from fastapi import APIRouter, HTTPException, status

from backend.schemas.tts import (
    TTSGenerateRequest,
    TTSGenerateResponse,
    VoicesResponse,
)
from backend.services.tts_service import TTSService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/voices",
    response_model=VoicesResponse,
    summary="Get available voices and languages",
)
@router.get(
    "/tts/voices",
    response_model=VoicesResponse,
    include_in_schema=False,
)
async def get_voices():
    try:
        return TTSService.get_supported_voices()
    except Exception as exc:
        logger.error(f"Error fetching voices: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load voice list.",
        )


@router.post(
    "/tts",
    response_model=TTSGenerateResponse,
    summary="Generate speech from text",
)
@router.post(
    "/tts/generate",
    response_model=TTSGenerateResponse,
    include_in_schema=False,
)
async def generate_speech(payload: TTSGenerateRequest):
    try:
        return await TTSService.synthesize(
            text=payload.text,
            voice=payload.voice,
            rate=payload.rate,
            pitch=payload.pitch,
            volume=payload.volume,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as exc:
        logger.error(f"Error generating audio: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate speech audio.",
        )
