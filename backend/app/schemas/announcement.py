from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class AnnouncementTargetType(str, Enum):
    ALL = "all"
    PROGRAMME = "programme"
    COHORT = "cohort"
    INDIVIDUAL = "individual"


class AnnouncementResponse(BaseModel):
    id: str
    title: str
    body: str
    target_type: AnnouncementTargetType
    target_id: Optional[str]
    published_by: str
    published_at: Optional[datetime]
    expires_at: Optional[datetime]
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True
