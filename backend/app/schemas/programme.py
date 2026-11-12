from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class LessonResponse(BaseModel):
    id: str
    module_id: str
    title: str
    slug: str
    description: Optional[str]
    content: Optional[Dict[str, Any]]
    video_url: Optional[str]
    duration_minutes: Optional[int]
    sequence_number: int
    is_required: bool
    is_published: bool
    created_at: datetime

    # Progress data (if joined)
    progress_status: Optional[str] = None
    progress_percentage: Optional[int] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ModuleResponse(BaseModel):
    id: str
    programme_id: str
    title: str
    slug: str
    description: Optional[str]
    learning_objectives: List[str] = []
    sequence_number: int
    is_published: bool
    created_at: datetime

    # Nested lessons
    lessons: List[LessonResponse] = []

    # Progress summary
    total_lessons: int = 0
    completed_lessons: int = 0

    class Config:
        from_attributes = True


class ProgrammeResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: Optional[str]
    cover_image_path: Optional[str]
    duration_weeks: Optional[int]
    is_published: bool
    created_at: datetime

    # Nested modules
    modules: List[ModuleResponse] = []

    # Progress summary
    total_modules: int = 0
    completed_modules: int = 0

    class Config:
        from_attributes = True
