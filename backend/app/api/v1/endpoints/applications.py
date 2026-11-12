from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationSubmit,
    ApplicationReview,
    ApplicationResponse,
    ApplicationStatus,
)
from app.services.application_service import ApplicationService
from app.core.dependencies import CurrentUserId, StudentUserId, AdminUserId

router = APIRouter()


@router.post("", response_model=ApplicationResponse, status_code=201)
def create_application(
    data: ApplicationCreate,
    student_id: str = Depends(StudentUserId),
):
    """
    Student creates a new application.
    Initial status is 'draft'.
    """
    try:
        application = ApplicationService.create_application(student_id, data)
        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me", response_model=List[ApplicationResponse])
def get_my_applications(
    student_id: str = Depends(StudentUserId),
):
    """
    Student retrieves their own applications.
    """
    try:
        applications = ApplicationService.get_student_applications(student_id)
        return applications
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    user_id: str = Depends(CurrentUserId),
):
    """
    Get application by ID.
    Students can only see their own applications.
    Admin can see all applications.
    """
    try:
        application = ApplicationService.get_application(application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        # Check authorization: must be owner or admin
        from app.core.database import supabase_admin

        profile = (
            supabase_admin.table("profiles")
            .select("role")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not profile.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        is_admin = profile.data["role"] == "admin"
        is_owner = application["student_id"] == user_id

        if not (is_admin or is_owner):
            raise HTTPException(
                status_code=403, detail="Not authorized to view this application"
            )

        return application
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: str,
    data: ApplicationUpdate,
    student_id: str = Depends(StudentUserId),
):
    """
    Student updates their draft application.
    Only allowed for applications in 'draft' status.
    """
    try:
        application = ApplicationService.update_application(
            application_id, student_id, data
        )
        return application
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
def submit_application(
    application_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Student submits application for review.
    Changes status from 'draft' to 'submitted'.
    """
    try:
        application = ApplicationService.submit_application(application_id, student_id)
        return application
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{application_id}/review", response_model=ApplicationResponse)
def review_application(
    application_id: str,
    data: ApplicationReview,
    admin_id: str = Depends(AdminUserId),
):
    """
    Admin reviews application and updates status.
    Valid statuses: under_review, additional_information_required, approved, rejected
    """
    try:
        application = ApplicationService.review_application(
            application_id, admin_id, data.status.value, data.review_notes
        )
        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    status: Optional[str] = Query(None),
    branch_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin_id: str = Depends(AdminUserId),
):
    """
    Admin lists all applications with optional filters.
    """
    try:
        applications = ApplicationService.list_applications(
            status=status, branch_id=branch_id, limit=limit, offset=offset
        )
        return applications
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
