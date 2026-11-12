from fastapi import APIRouter, Depends, HTTPException
from app.schemas.admin import DashboardStatsResponse
from app.services.admin_service import AdminService
from app.core.dependencies import AdminUserId

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    admin_id: str = Depends(AdminUserId),
):
    """
    Get admin dashboard statistics.
    Admin only.
    """
    try:
        stats = AdminService.get_dashboard_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
