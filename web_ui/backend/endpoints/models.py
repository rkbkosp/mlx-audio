from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path
from utils import model_provider
from mlx_audio.convert import convert

router = APIRouter()

class QuantizationRequest(BaseModel):
    hf_path: str
    mlx_path: str = "mlx_model"
    q_bits: int = 4
    upload_repo: Optional[str] = None

class ModelInfo(BaseModel):
    id: str
    loaded: bool = False

@router.get("/", response_model=List[ModelInfo])
async def list_models():
    """List loaded and available models."""
    loaded_models = await model_provider.get_loaded_models()
    
    # In a real app, we might scan the filesystem or HF cache for downloaded models.
    # For now, we list loaded models and maybe some presets if we had a registry.
    
    results = []
    for m in loaded_models:
        results.append(ModelInfo(id=m, loaded=True))
        
    return results

@router.post("/quantize")
async def quantize_model_endpoint(req: QuantizationRequest, background_tasks: BackgroundTasks):
    """
    Quantize a model in the background.
    """
    # We run this in background because it's slow
    def run_quantization():
        try:
            print(f"Starting quantization for {req.hf_path}...")
            convert(
                hf_path=req.hf_path,
                mlx_path=req.mlx_path,
                quantize=True,
                q_bits=req.q_bits,
                upload_repo=req.upload_repo
            )
            print(f"Quantization finished for {req.hf_path}")
        except Exception as e:
            print(f"Quantization failed: {e}")

    background_tasks.add_task(run_quantization)
    return {"status": "queued", "message": f"Quantization started for {req.hf_path}"}

@router.delete("/{model_id}")
async def unload_model(model_id: str):
    """Unload a model from memory."""
    success = await model_provider.remove_model(model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found or not loaded")
    return {"status": "success", "message": f"Model {model_id} unloaded"}
