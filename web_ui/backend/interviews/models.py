from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class InterviewSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    filepath: str
    interviewee: Optional[str] = Field(default="Unknown")
    project_name: Optional[str] = Field(default="Default Project")
    date: datetime = Field(default_factory=datetime.now)
    status: str = Field(default="pending") # pending, processing, completed, failed
    transcript_path: Optional[str] = None
