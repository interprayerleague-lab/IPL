from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.schemas.admin import AnnouncementCreate, AnnouncementUpdate
from app.services.admin_service import AdminService
from app.core.database import supabase_admin
from app.core.dependencies import AdminUserId

router = APIRouter()


@router.post("")
def create_announcement(
    data: AnnouncementCreate,
    admin_id: str = Depends(AdminUserId),
):
    """
    Create new announcement.
    Admin only.
    """
    try:
        announcement_data = {
            **data.dict(),
            "published_by": admin_id,
            "published_at": datetime.utcnow().isoformat() if data.is_published else None,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = (
            supabase_admin.table("announcements").insert(announcement_data).execute()
        )

        if not result.data:
            raise ValueError("Failed to create announcement")

        announcement = result.data[0]

        # Log action
        AdminService.log_action(
            admin_id, "create_announcement", "announcement", announcement["id"]
        )

        return announcement
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{announcement_id}")
def update_announcement(
    announcement_id: str,
    data: AnnouncementUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """
    Update announcement.
    Admin only.
    """
    try:
        update_data = data.dict(exclude_unset=True)

        # Set published_at if publishing
        if data.is_published and not data.published_at:
            update_data["published_at"] = datetime.utcnow().isoformat()

        result = (
            supabase_admin.table("announcements")
            .update(update_data)
            .eq("id", announcement_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update announcement")

        announcement = result.data[0]

        # Log action
        AdminService.log_action(
            admin_id, "update_announcement", "announcement", announcement_id
        )

        return announcement
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("")
def list_all_announcements(
    admin_id: str = Depends(AdminUserId),
):
    """
    List all announcements (including unpublished).
    Admin only.
    """
    try:
        result = (
            supabase_admin.table("announcements")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """
    Delete announcement.
    Admin only.
    """
    try:
        result = (
            supabase_admin.table("announcements")
            .delete()
            .eq("id", announcement_id)
            .execute()
        )

        if result.data:
            AdminService.log_action(
                admin_id, "delete_announcement", "announcement", announcement_id
            )
            return {"message": "Announcement deleted successfully"}

        raise HTTPException(status_code=404, detail="Announcement not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
