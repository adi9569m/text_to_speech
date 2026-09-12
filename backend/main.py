import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from backend.models.database import Base, engine
from backend.routers import tts, history

# Initialize SQLite database tables (Day 3 feature)
Base.metadata.create_all(bind=engine)

load_dotenv()

app = FastAPI(
    title="Text-to-Speech API",
    description="Full-stack Text-to-Speech Application API powered by FastAPI and Neural TTS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audio file storage setup
BASE_DIR = Path(__file__).resolve().parent
AUDIO_DIR = BASE_DIR / os.getenv("AUDIO_OUTPUT_DIR", "generated_audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

# Register feature routers
app.include_router(tts.router, prefix="/api", tags=["TTS"])
app.include_router(history.router, prefix="/api", tags=["History"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
