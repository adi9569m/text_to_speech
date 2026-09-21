import os
import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from backend.models.database import Base, engine, init_db
from backend.routers import tts, history, auth, documents, ai, analytics

# Initialize database tables and schema
init_db()

load_dotenv()

app = FastAPI(
    title="VoiceFlow API",
    description="VoiceFlow Text-to-Speech Application API powered by FastAPI and Neural TTS",
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
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(ai.router, prefix="/api", tags=["AI Enhancement"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])


@app.get("/api/audio/{filename}", tags=["TTS"], summary="Stream generated audio file")
async def stream_audio(filename: str):
    """Stream generated audio file with range requests support."""
    # Prevent path traversal attacks
    safe_filename = Path(filename).name
    filepath = AUDIO_DIR / safe_filename

    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"Audio file '{safe_filename}' not found.",
        )

    return FileResponse(
        path=filepath,
        media_type="audio/mpeg",
        filename=safe_filename,
        headers={"Accept-Ranges": "bytes"},
    )


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}


@app.get("/favicon.ico", include_in_schema=False)
async def favicon_endpoint():
    return Response(status_code=204)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True, app_dir=str(PROJECT_ROOT))
