import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.history import AudioHistory
from backend.schemas.history import (
    AudioHistoryList,
    HistoryDeleteResponse,
    HistoryFavoriteResponse,
)

BASE_DIR = Path(__file__).resolve().parent.parent
AUDIO_DIR = BASE_DIR / os.getenv("AUDIO_OUTPUT_DIR", "generated_audio")

router = APIRouter(prefix="/history", tags=["History"])


@router.get(
    "",
    response_model=AudioHistoryList,
    summary="Get audio generation history",
)
def get_history(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=50, ge=1, le=100, description="Max records to return"),
    favorite_only: bool = Query(default=False, description="Filter favorites only (Day 5 feature)"),
    db: Session = Depends(get_db),
):
    """Retrieve list of previously generated audio items, ordered newest first."""
    query = db.query(AudioHistory)
    if favorite_only:
        query = query.filter(AudioHistory.is_favorite == True)
    query = query.order_by(AudioHistory.created_at.desc())
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.patch(
    "/{history_id}/favorite",
    response_model=HistoryFavoriteResponse,
    summary="Toggle favorite status of a history item (Day 5 feature)",
)
def toggle_favorite(history_id: int, db: Session = Depends(get_db)):
    """Toggle the favorite status of a specific audio history item."""
    item = db.query(AudioHistory).filter(AudioHistory.id == history_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"History item with ID {history_id} not found.",
        )

    item.is_favorite = not item.is_favorite
    db.commit()
    db.refresh(item)

    status_str = "marked as favorite" if item.is_favorite else "removed from favorites"
    return {
        "success": True,
        "id": item.id,
        "is_favorite": item.is_favorite,
        "message": f"History item {history_id} {status_str}.",
    }



@router.delete(
    "/{history_id}",
    response_model=HistoryDeleteResponse,
    summary="Delete a history item by ID",
)
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    """Delete a single history record and its associated audio file."""
    item = db.query(AudioHistory).filter(AudioHistory.id == history_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"History item with ID {history_id} not found.",
        )

    # Delete audio file from storage if present
    if item.audio_url:
        filename = Path(item.audio_url).name
        file_path = AUDIO_DIR / filename
        if file_path.is_file():
            try:
                file_path.unlink()
            except OSError:
                pass

    db.delete(item)
    db.commit()
    return {
        "success": True,
        "message": f"History item {history_id} deleted successfully.",
    }


@router.delete(
    "",
    response_model=HistoryDeleteResponse,
    summary="Clear all audio generation history",
)
def clear_all_history(db: Session = Depends(get_db)):
    """Clear all history records and remove generated audio files."""
    items = db.query(AudioHistory).all()
    for item in items:
        if item.audio_url:
            filename = Path(item.audio_url).name
            file_path = AUDIO_DIR / filename
            if file_path.is_file():
                try:
                    file_path.unlink()
                except OSError:
                    pass

    db.query(AudioHistory).delete()
    db.commit()
    return {
        "success": True,
        "message": "All audio history cleared successfully.",
    }
