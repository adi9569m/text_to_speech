import os
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Database file location in backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "tts_history.db"

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread is set to False for SQLite with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db():
    """Initialize database tables and ensure Day 5 is_favorite and Day 8 user_id columns exist."""
    # Ensure models are loaded onto Base
    from backend.models.history import AudioHistory  # noqa: F401
    from backend.models.user import User  # noqa: F401

    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(audio_history)"))
            columns = [row[1] for row in res.fetchall()]
            if columns and "is_favorite" not in columns:
                conn.execute(text("ALTER TABLE audio_history ADD COLUMN is_favorite BOOLEAN DEFAULT 0"))
                conn.commit()
            if columns and "user_id" not in columns:
                conn.execute(text("ALTER TABLE audio_history ADD COLUMN user_id INTEGER DEFAULT NULL"))
                conn.commit()
        except Exception:
            pass


def get_db():
    """FastAPI dependency to provide a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

