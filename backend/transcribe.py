"""
Audio/Video transcription using OpenAI Whisper (local model).
Supports: mp3, wav, m4a, mp4, webm, mov
"""
import os
import tempfile
import warnings
from fastapi import HTTPException

# Lazy loaded whisper model
model = None


def get_whisper_model():
    global model
    if model is None:
        try:
            import whisper
            print("🎙️ Loading Whisper base model...")
            model = whisper.load_model("base")
        except ImportError:
            raise HTTPException(status_code=500, detail="Whisper is not installed. C drive is full and could not install PyTorch.")
    return model


AUDIO_EXTENSIONS = {"mp3", "wav", "m4a", "ogg", "flac"}
VIDEO_EXTENSIONS = {"mp4", "webm", "mov", "avi", "mkv"}
ALL_MEDIA_EXTENSIONS = AUDIO_EXTENSIONS | VIDEO_EXTENSIONS


def is_media_file(filename: str) -> bool:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    return ext in ALL_MEDIA_EXTENSIONS


def transcribe_media(file_bytes: bytes, filename: str) -> str:
    """
    Transcribe audio or video file to text using Whisper.
    For video files, Whisper extracts the audio track automatically.
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "wav"

    # Write to temp file (Whisper needs a file path)
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        model = get_whisper_model()
        result = model.transcribe(tmp_path)
        return result["text"]
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
