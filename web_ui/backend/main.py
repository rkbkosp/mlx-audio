import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from endpoints import models, tts, stt, sts, system
from interviews import router as interviews_router
from database import create_db_and_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="MLX Audio WebUI", version="1.0.0", lifespan=lifespan)

# CORS Configuration
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(models.router, prefix="/v1/models", tags=["Models"])
app.include_router(tts.router, prefix="/v1/audio/speech", tags=["TTS"])
app.include_router(stt.router, prefix="/v1/audio/transcriptions", tags=["STT"])
app.include_router(sts.router, prefix="/v1/audio/sts", tags=["STS"])
app.include_router(system.router, prefix="/v1/system", tags=["System"])
from fastapi.staticfiles import StaticFiles

# ... existing code ...

app.include_router(interviews_router.router, prefix="/v1/interviews", tags=["Interviews"])

# Mount uploads directory for static access
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/files", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
