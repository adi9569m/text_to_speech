# VoiceFlow — Text to Speech Studio

VoiceFlow is a full-stack web application that converts text and uploaded documents into high-quality spoken audio using neural text-to-speech voices. Built with a FastAPI backend and a React 19 frontend.

---

## Features

- **Neural Speech Synthesis**: Powered by Microsoft Edge TTS with a curated selection of natural-sounding voices across English, Hindi, Gujarati, Marathi, Spanish, French, German, and more.
- **Voice Auditions**: Listen to a quick preview of any voice before generating full audio.
- **Audio Tuning**: Adjust speech rate, pitch, and volume to match your desired pacing and tone.
- **Document Text Import**: Drag and drop `.txt`, `.pdf`, or `.docx` documents to automatically extract and populate text in the editor.
- **Text Assistant**: Built-in text adjustments to clean up punctuation and vocal fillers, convert text to conversational dialogue, summarize long text, or polish it for presentations.
- **Audio Workstation Player**:
  - Live frequency spectrum visualizer
  - Waveform seek bar with time elapsed/remaining
  - Quick skip (-5s / +5s)
  - Speed adjustments (0.75x to 2.0x)
  - Volume slider and one-click mute
  - Download as MP3 or WAV
  - One-click copy for shareable audio links
- **History & Library**: Saves generated audio clips locally. Filter by favorites, search by text or voice name, reload past scripts into the editor, or delete unwanted records.
- **User Accounts**: Optional registration and sign-in (passwords hashed with PBKDF2). Logged-in users have their history isolated to their account, while guests can still use the app with a shared session.
- **Usage Analytics**: Real-time stats on total generations, character counts, words spoken, and popular voices.

---

## Tech Stack

- **Backend**:
  - Python 3.10+
  - FastAPI
  - Uvicorn
  - edge-tts
  - SQLAlchemy & SQLite
  - pypdf & python-docx
  - pytest
- **Frontend**:
  - React 19
  - Vite
  - Tailwind CSS
  - Lucide React (icons)
  - Axios

---

## Getting Started

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm

### 1. Backend Setup

From the project root:

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python run_server.py
```

The backend server starts on `http://127.0.0.1:8000`.
- API health check: `http://127.0.0.1:8000/api/health`
- Interactive Swagger docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
texttospeech/
├── backend/
│   ├── main.py                 # FastAPI app entry point and route registration
│   ├── run.py                  # Convenience script to start uvicorn
│   ├── models/
│   │   ├── database.py         # SQLAlchemy engine and session setup
│   │   ├── history.py          # AudioHistory database model
│   │   └── user.py             # User database model
│   ├── routers/
│   │   ├── ai.py               # Text enhancement endpoints
│   │   ├── analytics.py        # Usage statistics endpoint
│   │   ├── auth.py             # User registration and login
│   │   ├── documents.py        # Text extraction from TXT, PDF, DOCX
│   │   ├── history.py          # Audio history and favorites management
│   │   └── tts.py              # Speech generation and voice catalog
│   ├── schemas/                # Pydantic request and response models
│   ├── services/
│   │   ├── ai_service.py       # Text cleanup and transformation logic
│   │   ├── auth_service.py     # Password hashing and session token logic
│   │   ├── document_service.py # Document parsing service
│   │   └── tts_service.py      # Edge TTS synthesis wrapper
│   └── tests/                  # Pytest test suite (47 tests)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsView.jsx   # Usage statistics dashboard
│   │   │   ├── AudioPlayer.jsx     # Waveform player and audio controls
│   │   │   ├── AuthModal.jsx       # Login and registration dialog
│   │   │   ├── LibraryView.jsx     # Audio history and favorites view
│   │   │   ├── Navbar.jsx          # Header navigation and status
│   │   │   ├── StudioView.jsx      # Main workstation interface
│   │   │   ├── Toast.jsx           # Notification alert popups
│   │   │   └── VoiceSelector.jsx   # Voice dropdown and preview buttons
│   │   ├── App.jsx             # Top-level state and layout
│   │   ├── index.css           # Global typography and styling
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   └── vite.config.js
├── run_server.py               # Root script to run the backend server
├── requirements.txt            # Python dependencies
└── postman_collection.json     # Postman collection with automated test scripts
```

---

## API Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/voices` | List available voices and languages |
| `GET` | `/api/voices/{id}/sample` | Stream an audio preview sample for a voice |
| `POST` | `/api/tts` | Synthesize speech from text |
| `GET` | `/api/audio/{filename}` | Stream a generated audio file |
| `POST` | `/api/extract-text` | Extract text from uploaded document (.txt, .pdf, .docx) |
| `POST` | `/api/ai/enhance` | Apply text enhancements (grammar, conversational, summarize, etc.) |
| `GET` | `/api/history` | Retrieve speech generation history |
| `PATCH` | `/api/history/{id}/favorite` | Toggle favorite bookmark on a clip |
| `DELETE` | `/api/history/{id}` | Delete a history item and its audio file |
| `DELETE` | `/api/history` | Clear all history records |
| `GET` | `/api/analytics` | Get aggregate synthesis and usage metrics |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive a session token |
| `GET` | `/api/auth/me` | Get the currently logged-in user profile |

---

## Running Tests

Run the backend test suite with `pytest`:

```bash
pytest
```

All 47 tests cover:
- Text-to-speech synthesis and parameter validation
- Multi-format document text extraction (.txt, .pdf, .docx)
- Text assistant modes and analytics computation
- User registration, authentication, and session tokens
- History persistence, scoping, and favorite toggling
- Error handling (empty text, oversized text, missing files, invalid routes)
- Postman collection structure and route coverage

---

## License

MIT License. Feel free to use and modify for your own projects.
