import logging
from collections import Counter
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.history import AudioHistory
from backend.models.user import User
from backend.services.auth_service import get_optional_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "",
    summary="Get application usage statistics and analytics",
    description="Returns usage metrics. Scoped to the authenticated user by default. Pass scope=global for system-wide metrics.",
)
async def get_analytics(
    scope: str = Query(
        default="user",
        description="Analytics scope: 'user' for personal metrics, 'global' for platform-wide metrics",
    ),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    try:
        # Determine if we should scope to authenticated user
        is_personal = (scope != "global") and (user is not None)

        query = db.query(AudioHistory)
        if is_personal:
            query = query.filter(AudioHistory.user_id == user.id)
        elif scope != "global":
            # Guest scope: audio created without account
            query = query.filter(AudioHistory.user_id.is_(None))
        # If scope == "global", no user_id filter applied

        records = query.all()
        total_generations = len(records)
        total_chars = sum(len(r.text) for r in records)
        total_words = sum(len(r.text.split()) for r in records)
        total_favorites = sum(1 for r in records if r.is_favorite)

        # Voice counts
        voice_counter = Counter(r.voice for r in records if r.voice)
        top_voices = [
            {"voice": v, "count": c}
            for v, c in voice_counter.most_common(5)
        ]

        # Language counts
        lang_counter = Counter(r.language for r in records if r.language)
        top_languages = [
            {"language": l, "count": c}
            for l, c in lang_counter.most_common(5)
        ]

        # Global metrics for context
        total_users = db.query(User).count()
        global_total_generations = db.query(AudioHistory).count()

        most_used_voice = top_voices[0]["voice"] if top_voices else None
        avg_chars = round(total_chars / total_generations) if total_generations > 0 else 0

        user_info = None
        if user:
            user_info = {
                "id": user.id,
                "username": user.username,
                "name": user.name or user.username,
            }

        resolved_scope = "user" if is_personal else ("guest" if scope != "global" else "global")

        return {
            "success": True,
            "scope": resolved_scope,
            "is_personal": is_personal,
            "user": user_info,
            "total_generations": total_generations,
            "total_characters_synthesized": total_chars,
            "total_words_synthesized": total_words,
            "total_favorites": total_favorites,
            "avg_chars_per_generation": avg_chars,
            "most_used_voice": most_used_voice,
            "total_registered_users": total_users,
            "global_total_generations": global_total_generations,
            "top_voices": top_voices,
            "top_languages": top_languages,
        }
    except Exception as exc:
        logger.error(f"Error computing analytics: {exc}")
        return {
            "success": True,
            "scope": "error",
            "is_personal": False,
            "user": None,
            "total_generations": 0,
            "total_characters_synthesized": 0,
            "total_words_synthesized": 0,
            "total_favorites": 0,
            "avg_chars_per_generation": 0,
            "most_used_voice": None,
            "total_registered_users": 0,
            "global_total_generations": 0,
            "top_voices": [],
            "top_languages": [],
        }
