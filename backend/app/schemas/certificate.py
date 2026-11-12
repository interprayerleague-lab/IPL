from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class CertificateStatus(str, Enum):
    ISSUED = "issued"
    REVOKED = "revoked"


class CertificateCreate(BaseModel):
    enrollment_id: str


class CertificateResponse(BaseModel):
    id: str
    enrollment_id: str
    student_id: str
    certificate_number: str
    issued_at: datetime
    file_path: Optional[str]
    status: CertificateStatus
    created_at: datetime

    # Joined data
    student_name: Optional[str] = None
    programme_title: Optional[str] = None

    class Config:
        from_attributes = True


class CertificateEligibility(BaseModel):
    is_eligible: bool
    reason: Optional[str] = None
    completion_percentage: int = 0
    completed_modules: int = 0
    total_modules: int = 0
    total_lessons: int = 0
    completed_lessons: int = 0
    total_quizzes: int = 0
    passed_quizzes: int = 0
