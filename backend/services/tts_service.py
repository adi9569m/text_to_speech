import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
import edge_tts
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
AUDIO_DIR = BASE_DIR / os.getenv("AUDIO_OUTPUT_DIR", "generated_audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_BASE_URL = os.getenv("AUDIO_BASE_URL", "/audio")

# Curated list of neural voices
CURATED_VOICES: List[Dict[str, str]] = [
    {
        "id": "en-US-JennyNeural",
        "name": "Jenny (Female)",
        "gender": "Female",
        "locale": "en-US",
        "language": "English (US)",
    },
    {
        "id": "en-US-GuyNeural",
        "name": "Guy (Male)",
        "gender": "Male",
        "locale": "en-US",
        "language": "English (US)",
    },
    {
        "id": "en-US-AriaNeural",
        "name": "Aria (Female)",
        "gender": "Female",
        "locale": "en-US",
        "language": "English (US)",
    },
    {
        "id": "hi-IN-SwaraNeural",
        "name": "Swara (Female)",
        "gender": "Female",
        "locale": "hi-IN",
        "language": "Hindi (India)",
    },
    {
        "id": "hi-IN-MadhurNeural",
        "name": "Madhur (Male)",
        "gender": "Male",
        "locale": "hi-IN",
        "language": "Hindi (India)",
    },
    {
        "id": "gu-IN-DhwaniNeural",
        "name": "Dhwani (Female)",
        "gender": "Female",
        "locale": "gu-IN",
        "language": "Gujarati (India)",
    },
    {
        "id": "gu-IN-NiranjanNeural",
        "name": "Niranjan (Male)",
        "gender": "Male",
        "locale": "gu-IN",
        "language": "Gujarati (India)",
    },
    {
        "id": "mr-IN-AarohiNeural",
        "name": "Aarohi (Female)",
        "gender": "Female",
        "locale": "mr-IN",
        "language": "Marathi (India)",
    },
    {
        "id": "mr-IN-ManoharNeural",
        "name": "Manohar (Male)",
        "gender": "Male",
        "locale": "mr-IN",
        "language": "Marathi (India)",
    },
    {
        "id": "es-ES-ElviraNeural",
        "name": "Elvira (Female)",
        "gender": "Female",
        "locale": "es-ES",
        "language": "Spanish (Spain)",
    },
    {
        "id": "es-ES-AlvaroNeural",
        "name": "Alvaro (Male)",
        "gender": "Male",
        "locale": "es-ES",
        "language": "Spanish (Spain)",
    },
    {
        "id": "fr-FR-DeniseNeural",
        "name": "Denise (Female)",
        "gender": "Female",
        "locale": "fr-FR",
        "language": "French (France)",
    },
    {
        "id": "fr-FR-HenriNeural",
        "name": "Henri (Male)",
        "gender": "Male",
        "locale": "fr-FR",
        "language": "French (France)",
    },
    {
        "id": "de-DE-KatjaNeural",
        "name": "Katja (Female)",
        "gender": "Female",
        "locale": "de-DE",
        "language": "German (Germany)",
    },
    {
        "id": "de-DE-ConradNeural",
        "name": "Conrad (Male)",
        "gender": "Male",
        "locale": "de-DE",
        "language": "German (Germany)",
    },
]


class TTSService:
    @staticmethod
    def get_supported_voices() -> Dict[str, Any]:
        languages = []
        for voice in CURATED_VOICES:
            lang = voice["language"]
            if lang not in languages:
                languages.append(lang)

        return {
            "languages": languages,
            "voices": CURATED_VOICES,
        }

    @staticmethod
    def get_language_for_voice(voice_id: str) -> str:
        for voice in CURATED_VOICES:
            if voice["id"] == voice_id:
                return voice["language"]
        return "English (US)"

    @staticmethod
    async def synthesize(
        text: str,
        voice: str = "en-US-JennyNeural",
        rate: str = "+0%",
        pitch: str = "+0Hz",
        volume: str = "+0%",
    ) -> Dict[str, Any]:
        clean_text = text.strip()
        if not clean_text:
            raise ValueError("Please provide some text to convert.")

        if len(clean_text) > 1000:
            raise ValueError("Text exceeds maximum limit of 1000 characters.")

        valid_voice_ids = [v["id"] for v in CURATED_VOICES]
        if voice not in valid_voice_ids:
            raise ValueError(f"Invalid voice '{voice}'. Please select a supported voice.")

        # Safe rate, pitch, and volume adjustments
        valid_rate = rate if (rate.startswith(("+", "-")) and rate.endswith("%")) else "+0%"
        valid_pitch = pitch if (pitch.startswith(("+", "-")) and pitch.endswith("Hz")) else "+0Hz"
        valid_volume = volume if (volume.startswith(("+", "-")) and volume.endswith("%")) else "+0%"

        # Unique filename
        file_id = uuid.uuid4().hex[:12]
        filename = f"tts_{file_id}.mp3"
        filepath = AUDIO_DIR / filename

        tts = edge_tts.Communicate(
            text=clean_text,
            voice=voice,
            rate=valid_rate,
            pitch=valid_pitch,
            volume=valid_volume,
        )
        await tts.save(str(filepath))
        file_size = os.path.getsize(filepath) if filepath.exists() else 0

        return {
            "success": True,
            "filename": filename,
            "audio_url": f"{AUDIO_BASE_URL.rstrip('/')}/{filename}",
            "voice": voice,
            "text_length": len(clean_text),
            "char_count": len(clean_text),
            "word_count": len(clean_text.split()),
            "file_size_bytes": file_size,
            "audio_format": "mp3",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    @classmethod
    async def get_voice_sample(cls, voice_id: str) -> Dict[str, Any]:
        """Generate or retrieve a cached audio sample for quick voice preview."""
        voice_info = next((v for v in CURATED_VOICES if v["id"] == voice_id), None)
        if not voice_info:
            raise ValueError(f"Invalid voice '{voice_id}'.")

        sample_filename = f"sample_{voice_id}.mp3"
        sample_path = AUDIO_DIR / sample_filename

        if not sample_path.exists():
            sample_text = f"Hello! This is a preview of the {voice_info['name']} voice."
            tts = edge_tts.Communicate(text=sample_text, voice=voice_id)
            await tts.save(str(sample_path))

        return {
            "success": True,
            "voice": voice_id,
            "name": voice_info["name"],
            "language": voice_info["language"],
            "sample_audio_url": f"{AUDIO_BASE_URL.rstrip('/')}/{sample_filename}",
        }
