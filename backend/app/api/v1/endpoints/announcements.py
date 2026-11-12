from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.schemas.announcement import AnnouncementResponse
from app.services.announcement_service import AnnouncementService
from app.core.dependencies import StudentUserId

router = APIRouter()


@router.get("", response_model=List[AnnouncementResponse])
def get_announcements(
    limit: int = Query(20, ge=1, le=100),
    student_id: str = Depends(StudentUserId),
):
    """
    Get announcements visible to current student.
    Includes announcements targeted to all, their cohort, programme, or them individually.
    """
    try:
        announcements = AnnouncementService.get_student_announcements(
            student_id, limit
        )
        return announcements
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
