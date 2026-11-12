from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.schemas.admin import EnrollmentCreate, EnrollmentUpdate
from app.services.admin_service import AdminService
from app.core.database import supabase_admin
from app.core.dependencies import AdminUserId

router = APIRouter()


@router.post("")
def create_enrollment(
    data: EnrollmentCreate,
    admin_id: str = Depends(AdminUserId),
):
    """
    Create new enrollment.
    Admin only.
    """
    try:
        enrollment_data = {
            **data.dict(),
            "enrolled_at": datetime.utcnow().isoformat()
            if data.status == "active"
            else None,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("enrollments").insert(enrollment_data).execute()

        if not result.data:
            raise ValueError("Failed to create enrollment")

        enrollment = result.data[0]

        # Log action
        AdminService.log_action(
            admin_id,
            "create_enrollment",
            "enrollment",
            enrollment["id"],
            {"student_id": data.student_id, "programme_id": data.programme_id},
        )

        return enrollment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{enrollment_id}")
def update_enrollment(
    enrollment_id: str,
    data: EnrollmentUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """
    Update enrollment.
    Admin only.
    """
    try:
        update_data = data.dict(exclude_unset=True)

        # Set enrolled_at if changing to active
        if data.status == "active":
            update_data["enrolled_at"] = datetime.utcnow().isoformat()

        # Set completed_at if changing to completed
        if data.status == "completed":
            update_data["completed_at"] = datetime.utcnow().isoformat()

        result = (
            supabase_admin.table("enrollments")
            .update(update_data)
            .eq("id", enrollment_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update enrollment")

        enrollment = result.data[0]

        # Log action
        AdminService.log_action(
            admin_id, "update_enrollment", "enrollment", enrollment_id, update_data
        )

        return enrollment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("")
def list_enrollments(
    programme_id: str = None,
    status: str = None,
    admin_id: str = Depends(AdminUserId),
):
    """
    List all enrollments with filters.
    Admin only.
    """
    try:
        query = supabase_admin.table("enrollments").select(
            """
            *,
            profiles!inner(first_name, last_name, email),
            programmes(title),
            cohorts(name)
        """
        ).order("created_at", desc=True)

        if programme_id:
            query = query.eq("programme_id", programme_id)
        if status:
            query = query.eq("status", status)

        result = query.execute()

        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
