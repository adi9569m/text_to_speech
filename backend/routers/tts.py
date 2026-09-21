import logging
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from backend.models.database import get_db
from backend.models.history import AudioHistory
from backend.models.user import User
from backend.schemas.tts import (
    TTSGenerateRequest,
    TTSGenerateResponse,
    VoicesResponse,
)
from backend.services.auth_service import get_optional_user
from backend.services.tts_service import TTSService

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory sliding window rate limiter
# Allows up to 30 speech generation requests per 60 seconds per client
RATE_LIMIT_STORE = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = 30
RATE_LIMIT_WINDOW_SECONDS = 60


def check_rate_limit(client_id: str):
    now = time.time()
    timestamps = RATE_LIMIT_STORE[client_id]
    # Prune timestamps outside the window
    RATE_LIMIT_STORE[client_id] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(RATE_LIMIT_STORE[client_id]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Limit is {RATE_LIMIT_MAX_REQUESTS} requests per minute. Please try again shortly.",
        )
    RATE_LIMIT_STORE[client_id].append(now)


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


@router.get(
    "/voices/{voice_id}/sample",
    summary="Get audio preview sample for a specific voice",
)
async def get_voice_sample(voice_id: str):
    try:
        return await TTSService.get_voice_sample(voice_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as exc:
        logger.error(f"Error generating voice sample for '{voice_id}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate voice preview sample.",
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
async def generate_speech(
    payload: TTSGenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    # Enforce rate limiting per client
    client_id = f"user_{user.id}" if user else f"ip_{request.client.host if request.client else 'anonymous'}"
    check_rate_limit(client_id)
    try:
        result = await TTSService.synthesize(
            text=payload.text,
            voice=payload.voice,
            rate=payload.rate,
            pitch=payload.pitch,
            volume=payload.volume,
        )

        # Save to database history
        try:
            resolved_lang = payload.language or TTSService.get_language_for_voice(payload.voice)
            history_record = AudioHistory(
                text=payload.text.strip(),
                language=resolved_lang,
                voice=payload.voice,
                audio_url=result["audio_url"],
                user_id=user.id if user else None,
            )
            db.add(history_record)
            db.commit()
        except Exception as db_exc:
            logger.warning(f"Could not persist history record: {db_exc}")
            db.rollback()

        return result
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
