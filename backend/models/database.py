import os
from pathlib import Path
from sqlalchemy import create_engine
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


def get_db():
    """FastAPI dependency to provide a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
