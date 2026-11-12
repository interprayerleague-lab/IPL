from fastapi import APIRouter, Depends, HTTPException
from app.schemas.application import ApplicationReview
from app.services.application_service import ApplicationService
from app.services.admin_service import AdminService
from app.core.dependencies import AdminUserId

router = APIRouter()


@router.post("/{application_id}/review")
def review_application(
    application_id: str,
    data: ApplicationReview,
    admin_id: str = Depends(AdminUserId),
):
    """
    Review and update application status.
    Admin only.
    """
    try:
        application = ApplicationService.review_application(
            application_id, admin_id, data.status.value, data.review_notes
        )

        # Log action
        AdminService.log_action(
            admin_id,
            "review_application",
            "application",
            application_id,
            {"status": data.status.value, "has_notes": bool(data.review_notes)},
        )

        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
