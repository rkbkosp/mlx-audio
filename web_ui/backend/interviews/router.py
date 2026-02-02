import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlmodel import Session, select

from database import get_session
from interviews.models import InterviewSession

from mlx_audio.stt.utils import load
from mlx_audio.stt.generate import generate_transcription

router = APIRouter()

UPLOAD_DIR = Path("uploads/interviews")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def process_transcription(session_id: int, file_path: str):
    """Background task to transcribe audio"""
    try:
        from web_ui.backend.database import engine
        with Session(engine) as db:
            session = db.get(InterviewSession, session_id)
            if not session:
                return
            
            session.status = "processing"
            db.add(session)
            db.commit()

            # Load model
            # Using Whisper Turbo for speed as default
            result = generate_transcription(
                model="mlx-community/whisper-large-v3-turbo-asr-fp16",
                audio=file_path,
                output_dir=str(UPLOAD_DIR), # Just to be safe, though we get result text directly
                verbose=False
            )
            
            # Save raw text
            transcript_filename = Path(file_path).with_suffix(".txt")
            with open(transcript_filename, "w") as f:
                f.write(result.text)

            # Save structured JSON segments if available, or just text
            # Depending on mlx_audio version, result might have 'segments'
            # We'll save the json dump of the result object or simple text
            import json
            transcript_json_path = Path(file_path).with_suffix(".json")
            
            segments_data = []
            if hasattr(result, 'segments'):
                segments_data = result.segments
            else:
                 # Fallback if no segments structure
                 segments_data = [{"text": result.text, "start": 0.0, "end": 0.0}]

            with open(transcript_json_path, "w") as f:
                json.dump(segments_data, f)

            session.status = "completed"
            session.transcript_path = str(transcript_json_path)
            db.add(session)
            db.commit()
            print(f"Transcription completed for session {session_id}")

    except Exception as e:
        print(f"Transcription failed for session {session_id}: {e}")
        from web_ui.backend.database import engine
        with Session(engine) as db:
             session = db.get(InterviewSession, session_id)
             if session:
                 session.status = "failed"
                 db.add(session)
                 db.commit()

@router.post("/", response_model=InterviewSession)
def create_interview(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    interviewee: str = Form("Unknown"),
    project_name: str = Form("Default Project"),
    date: str = Form(None), # YYYY-MM-DD
    db: Session = Depends(get_session)
):
    try:
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        interview_date = datetime.now()
        if date:
             try:
                 interview_date = datetime.strptime(date, "%Y-%m-%d")
             except:
                 pass

        session = InterviewSession(
            filename=file.filename,
            filepath=str(file_path),
            interviewee=interviewee,
            project_name=project_name,
            date=interview_date,
            status="pending"
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        background_tasks.add_task(process_transcription, session.id, str(file_path))

        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[InterviewSession])
def list_interviews(db: Session = Depends(get_session)):
    return db.exec(select(InterviewSession).order_by(InterviewSession.date.desc())).all()

@router.get("/{session_id}")
def get_interview(session_id: int, db: Session = Depends(get_session)):
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    transcript = []
    if session.transcript_path and os.path.exists(session.transcript_path):
        import json
        with open(session.transcript_path, "r") as f:
            transcript = json.load(f)
            
    return {"session": session, "transcript": transcript}

@router.delete("/{session_id}")
def delete_interview(session_id: int, db: Session = Depends(get_session)):
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Try delete files
    try:
        if os.path.exists(session.filepath):
            os.remove(session.filepath)
        if session.transcript_path and os.path.exists(session.transcript_path):
            os.remove(session.transcript_path)
            # Also remove .txt if exists
            txt_path = Path(session.transcript_path).with_suffix(".txt")
            if txt_path.exists():
                os.remove(txt_path)

    except Exception as e:
        print(f"Error deleting files: {e}")

    db.delete(session)
    db.commit()
    return {"ok": True}
