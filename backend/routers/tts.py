import logging
from fastapi import APIRouter, Depends, HTTPException, status
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
async def generate_speech(
    payload: TTSGenerateRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    try:
        result = await TTSService.synthesize(
            text=payload.text,
            voice=payload.voice,
            rate=payload.rate,
            pitch=payload.pitch,
            volume=payload.volume,
        )

        # Persist to database history (Day 3 & Day 8 User Association)
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
