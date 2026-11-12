from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime


# Programme schemas
class ProgrammeCreate(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    cover_image_path: Optional[str] = None
    duration_weeks: Optional[int] = None
    is_published: bool = False


class ProgrammeUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    cover_image_path: Optional[str] = None
    duration_weeks: Optional[int] = None
    is_published: Optional[bool] = None


# Module schemas
class ModuleCreate(BaseModel):
    programme_id: str
    title: str
    slug: str
    description: Optional[str] = None
    learning_objectives: List[str] = Field(default_factory=list)
    sequence_number: int
    is_published: bool = False


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    sequence_number: Optional[int] = None
    is_published: Optional[bool] = None


# Lesson schemas
class LessonCreate(BaseModel):
    module_id: str
    title: str
    slug: str
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    sequence_number: int
    is_required: bool = True
    is_published: bool = False


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    sequence_number: Optional[int] = None
    is_required: Optional[bool] = None
    is_published: Optional[bool] = None


# Resource schemas
class ResourceCreate(BaseModel):
    lesson_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    external_url: Optional[str] = None
    resource_type: str
    is_downloadable: bool = True


class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_path: Optional[str] = None
    external_url: Optional[str] = None
    resource_type: Optional[str] = None
    is_downloadable: Optional[bool] = None


# Cohort schemas
class CohortCreate(BaseModel):
    branch_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "planned"  # planned, active, completed, cancelled


class CohortUpdate(BaseModel):
    branch_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


# Enrollment schemas
class EnrollmentCreate(BaseModel):
    student_id: str
    programme_id: str
    cohort_id: Optional[str] = None
    application_id: Optional[str] = None
    status: str = "pending"


class EnrollmentUpdate(BaseModel):
    cohort_id: Optional[str] = None
    status: Optional[str] = None


# Announcement schemas
class AnnouncementCreate(BaseModel):
    title: str
    body: str
    target_type: str  # all, programme, cohort, individual
    target_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_published: bool = False


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    published_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_published: Optional[bool] = None


# Dashboard response
class DashboardStatsResponse(BaseModel):
    enrolled_students: int
    pending_applications: int
    total_revenue_minor: int
    pending_payments: int
    average_completion_percentage: int
