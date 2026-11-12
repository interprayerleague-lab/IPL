from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.enrollment import EnrollmentResponse
from app.services.enrollment_service import EnrollmentService
from app.core.dependencies import StudentUserId

router = APIRouter()


@router.get("/me", response_model=List[EnrollmentResponse])
def get_my_enrollments(
    student_id: str = Depends(StudentUserId),
):
    """
    Get current student's enrollments.
    """
    try:
        enrollments = EnrollmentService.get_student_enrollments(student_id)
        return enrollments
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me/active", response_model=EnrollmentResponse)
def get_my_active_enrollment(
    student_id: str = Depends(StudentUserId),
):
    """
    Get current student's active enrollment.
    """
    try:
        enrollment = EnrollmentService.get_active_enrollment(student_id)
        if not enrollment:
            raise HTTPException(
                status_code=404, detail="No active enrollment found"
            )
        return enrollment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
