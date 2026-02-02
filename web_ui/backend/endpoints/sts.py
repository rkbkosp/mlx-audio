from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import io
import os
import zipfile
import time
import numpy as np
from mlx_audio.sts import SAMAudio, SAMAudioProcessor, MossFormer2SEModel
from mlx_audio.audio_io import write as audio_write
from mlx_audio.audio_io import read as audio_read
from utils import model_provider

router = APIRouter()

# STS models are heavy, we might want to cache them via model_provider, 
# but model_provider currently uses generic load_model which might not support specific STS classes directly 
# if they are not integrated into the main factory.
# README says: model = SAMAudio.from_pretrained(...)
# So we might need to extend ModelProvider or handle them locally here (cached).
# For now, let's use a local cache in this module or extend model_provider if needed. 
# But to be safe and consistent, let's try to use model_provider if it supports it, 
# otherwise valid fallback.

# Checking server.py/utils usage: load_model("...") returns a model. 
# If load_model supports "mlx-community/sam-audio-large", we are good.
# If not, we instantiate directly.

@router.post("/separation", response_class=StreamingResponse)
async def separate_audio(
    file: UploadFile = File(...),
    prompt: str = Form("A person speaking"),
    model: str = Form("mlx-community/sam-audio-large")
):
    """Separate audio using SAM-Audio."""
    # Read audio
    data = await file.read()
    tmp_in = io.BytesIO(data)
    # audio_read returns (audio_array, sample_rate)
    # SAM Audio usually expects specific format/SR.
    
    # We'll save to temp file because SAMAudio usually works with files or arrays
    temp_dir = "/tmp/mlx_audio_sts"
    os.makedirs(temp_dir, exist_ok=True)
    input_path = f"{temp_dir}/input_{time.time()}.wav"
    
    with open(input_path, "wb") as f:
        f.write(data)
        
    try:
        # Load model manually for now to ensure correct class usage if load_model is generic
        # (Assuming optimization later)
        sam_model = SAMAudio.from_pretrained(model)
        processor = SAMAudioProcessor.from_pretrained(model)
        
        # Process
        batch = processor(
            descriptions=[prompt],
            audios=[input_path],
        )
        
        result = sam_model.separate_long(
            batch.audios,
            descriptions=batch.descriptions,
            anchors=batch.anchor_ids,
            chunk_seconds=10.0,
            overlap_seconds=3.0,
             # ode_opt={"method": "midpoint", "step_size": 2/32}, # Optional
        )
        
        # Result has .target and .residual (lists of arrays)
        target_audio = result.target[0]
        residual_audio = result.residual[0]
        sr = sam_model.sample_rate
        
        # creating zip
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zf:
            # Write target
            b_target = io.BytesIO()
            audio_write(b_target, target_audio, sr, format="wav")
            zf.writestr("target.wav", b_target.getvalue())
            
            # Write residual
            b_residual = io.BytesIO()
            audio_write(b_residual, residual_audio, sr, format="wav")
            zf.writestr("residual.wav", b_residual.getvalue())
            
        zip_buffer.seek(0)
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=separation_results.zip"}
        )
        
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)


@router.post("/enhancement", response_class=StreamingResponse)
async def enhance_audio(
    file: UploadFile = File(...),
    model: str = Form("starkdmi/MossFormer2_SE_48K_MLX")
):
    """Enhance audio using MossFormer2."""
    data = await file.read()
    
    temp_dir = "/tmp/mlx_audio_sts"
    os.makedirs(temp_dir, exist_ok=True)
    input_path = f"{temp_dir}/noisy_{time.time()}.wav"
    
    with open(input_path, "wb") as f:
        f.write(data)

    try:
        # Load model
        # Using from_pretrained directly as per README
        moss_model = MossFormer2SEModel.from_pretrained(model)
        
        # Enhance
        enhanced = moss_model.enhance(input_path)
        
        # Save to buffer
        buffer = io.BytesIO()
        # MossFormer2 usually outputs 48k? or we should check model.sample_rate if available
        # The prompt says "48K_MLX" so likely 48000
        sr = 48000 
        audio_write(buffer, enhanced, sr, format="wav")
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=enhanced.wav"}
        )

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
