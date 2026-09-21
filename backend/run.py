import os
import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"Starting VoiceFlow FastAPI backend on http://{host}:{port}...")
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=True,
        app_dir=str(PROJECT_ROOT),
    )
