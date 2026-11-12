from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.progress import ProgressUpdate, ProgressResponse
from app.services.progress_service import ProgressService
from app.core.dependencies import StudentUserId

router = APIRouter()


@router.get("/me", response_model=List[ProgressResponse])
def get_my_progress(
    student_id: str = Depends(StudentUserId),
):
    """
    Get all progress records for current student.
    """
    try:
        progress = ProgressService.get_student_progress(student_id)
        return progress
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/lessons/{lesson_id}", response_model=ProgressResponse)
def get_lesson_progress(
    lesson_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get progress for a specific lesson.
    """
    try:
        progress = ProgressService.get_lesson_progress(student_id, lesson_id)
        if not progress:
            # Return default not_started progress
            return {
                "id": None,
                "student_id": student_id,
                "lesson_id": lesson_id,
                "status": "not_started",
                "progress_percentage": 0,
                "started_at": None,
                "completed_at": None,
                "last_accessed_at": None,
                "updated_at": None,
            }
        return progress
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/lessons/{lesson_id}", response_model=ProgressResponse)
def update_lesson_progress(
    lesson_id: str,
    data: ProgressUpdate,
    student_id: str = Depends(StudentUserId),
):
    """
    Update progress for a lesson.
    """
    try:
        progress = ProgressService.update_progress(
            student_id, lesson_id, data.status.value, data.progress_percentage
        )
        return progress
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
