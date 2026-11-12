from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ADDITIONAL_INFORMATION_REQUIRED = "additional_information_required"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class ApplicationCreate(BaseModel):
    branch_id: Optional[str] = None
    personal_information: Dict[str, Any] = Field(default_factory=dict)
    motivation: str


class ApplicationUpdate(BaseModel):
    branch_id: Optional[str] = None
    personal_information: Optional[Dict[str, Any]] = None
    motivation: Optional[str] = None


class ApplicationSubmit(BaseModel):
    """Empty schema for submit action"""
    pass


class ApplicationReview(BaseModel):
    status: ApplicationStatus
    review_notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    student_id: str
    branch_id: Optional[str]
    application_number: str
    status: ApplicationStatus
    personal_information: Dict[str, Any]
    motivation: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
