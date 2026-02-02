from fastapi import APIRouter
import psutil
import mlx.core as mx

router = APIRouter()

@router.get("/stats")
async def get_system_stats():
    """Get system resource usage statistics."""
    memory = psutil.virtual_memory()
    
    # MLX Memory info (if available via some API, otherwise just system RAM)
    # MLX uses unified memory, so system RAM is relevant.
    
    return {
        "memory": {
            "total": memory.total,
            "available": memory.available,
            "percent": memory.percent,
            "used": memory.used
        },
        "cpu": {
            "percent": psutil.cpu_percent(interval=None),
            "count": psutil.cpu_count()
        },
        "mlx": {
            "default_device": str(mx.default_device())
        }
    }
