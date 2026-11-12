from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ProgressStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class ProgressUpdate(BaseModel):
    status: ProgressStatus
    progress_percentage: int = Field(ge=0, le=100)


class ProgressResponse(BaseModel):
    id: str
    student_id: str
    lesson_id: str
    status: ProgressStatus
    progress_percentage: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    last_accessed_at: Optional[datetime]
    updated_at: datetime

    class Config:
        from_attributes = True
