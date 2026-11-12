from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.services.admin_service import AdminService
from app.core.dependencies import AdminUserId

router = APIRouter()


@router.get("")
def list_students(
    search: Optional[str] = Query(None),
    branch_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin_id: str = Depends(AdminUserId),
):
    """
    List all students with filters.
    Admin only.
    """
    try:
        students = AdminService.get_students_list(
            search=search,
            branch_id=branch_id,
            status=status,
            limit=limit,
            offset=offset,
        )
        return students
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{student_id}")
def get_student_detail(
    student_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """
    Get detailed student information.
    Admin only.
    """
    try:
        student = AdminService.get_student_detail(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
