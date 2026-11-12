from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class EnrollmentStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    SUSPENDED = "suspended"
    WITHDRAWN = "withdrawn"


class EnrollmentResponse(BaseModel):
    id: str
    student_id: str
    programme_id: str
    cohort_id: Optional[str]
    application_id: Optional[str]
    status: EnrollmentStatus
    enrolled_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    # Joined data
    programme_title: Optional[str] = None
    cohort_name: Optional[str] = None

    class Config:
        from_attributes = True
