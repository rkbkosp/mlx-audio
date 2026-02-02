from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import io
import os
import mlx_audio.audio_io as audio_io
from mlx_audio.audio_io import write as audio_write
from mlx_audio.tts.generate import load_audio
from utils import model_provider

router = APIRouter()

class SpeechRequest(BaseModel):
    model: str
    input: str
    instruct: str | None = None
    voice: str | None = None
    speed: float | None = 1.0
    gender: str | None = "male"
    pitch: float | None = 1.0
    lang_code: str | None = "a"
    ref_audio: str | None = None # Path to uploaded file
    ref_text: str | None = None
    temperature: float | None = 0.7
    top_p: float | None = 0.95
    top_k: int | None = 40
    repetition_penalty: float | None = 1.0
    response_format: str | None = "mp3"
    verbose: bool = False

async def generate_audio_stream(model, payload: SpeechRequest):
    # Load reference audio if provided
    ref_audio = payload.ref_audio
    if ref_audio and isinstance(ref_audio, str):
        if not os.path.exists(ref_audio):
             # Try to see if it's a temp path uploaded
             pass 

        # Determine if volume normalization is needed
        normalize = hasattr(model, "model_type") and model.model_type == "spark"
        
        try:
             # We might need to handle ref_audio loading carefully if it's not a path but bytes
             # But here we assume it's a path passed from frontend (which uploaded it first)
            ref_audio = load_audio(
                ref_audio, sample_rate=model.sample_rate, volume_normalize=normalize
            )
        except Exception as e:
            print(f"Error loading ref audio: {e}")
            # Fallback or error?

    for result in model.generate(
        payload.input,
        voice=payload.voice,
        speed=payload.speed,
        gender=payload.gender,
        pitch=payload.pitch,
        instruct=payload.instruct,
        lang_code=payload.lang_code,
        ref_audio=ref_audio,
        ref_text=payload.ref_text,
        temperature=payload.temperature,
        top_p=payload.top_p,
        top_k=payload.top_k,
        repetition_penalty=payload.repetition_penalty,
        verbose=payload.verbose,
    ):
        sample_rate = result.sample_rate
        buffer = io.BytesIO()
        audio_write(buffer, result.audio, sample_rate, format=payload.response_format)
        buffer.seek(0)
        yield buffer.getvalue()

@router.post("/", response_class=StreamingResponse)
async def tts_speech(payload: SpeechRequest):
    """Generate speech audio."""
    model = await model_provider.load_model(payload.model)
    
    return StreamingResponse(
        generate_audio_stream(model, payload),
        media_type=f"audio/{payload.response_format}",
        headers={
            "Content-Disposition": f"attachment; filename=speech.{payload.response_format}"
        },
    )

@router.post("/upload_ref")
async def upload_reference_audio(file: UploadFile = File(...)):
    """Upload reference audio for voice cloning."""
    # Save to temp directory
    temp_dir = "/tmp/mlx_audio_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = f"{temp_dir}/{file.filename}"
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    return {"status": "success", "file_path": file_path}
