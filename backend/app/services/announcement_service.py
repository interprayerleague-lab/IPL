from typing import List
from datetime import datetime
from app.core.database import supabase_admin


class AnnouncementService:
    """Service for managing announcements"""

    @staticmethod
    def get_student_announcements(
        student_id: str, limit: int = 20
    ) -> List[dict]:
        """Get announcements visible to a student"""
        now = datetime.utcnow().isoformat()

        # Get student's enrollment info for targeting
        enrollment_result = (
            supabase_admin.table("enrollments")
            .select("programme_id, cohort_id")
            .eq("student_id", student_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )

        # Build query for announcements
        # - target_type = 'all'
        # - target_type = 'individual' AND target_id = student_id
        # - target_type = 'programme' AND target_id = student's programme_id
        # - target_type = 'cohort' AND target_id = student's cohort_id

        query = (
            supabase_admin.table("announcements")
            .select("*")
            .eq("is_published", True)
            .lte("published_at", now)
        )

        # Filter by expiration (NULL or future date)
        # Note: Supabase doesn't have a direct OR condition for NULL,
        # so we fetch and filter in Python

        result = query.order("published_at", desc=True).limit(limit * 2).execute()

        # Filter announcements based on targeting
        announcements = []
        for announcement in result.data or []:
            # Check expiration
            if announcement.get("expires_at"):
                if announcement["expires_at"] < now:
                    continue

            target_type = announcement["target_type"]
            target_id = announcement.get("target_id")

            # All announcements
            if target_type == "all":
                announcements.append(announcement)
                continue

            # Individual targeting
            if target_type == "individual" and target_id == student_id:
                announcements.append(announcement)
                continue

            # Programme/cohort targeting
            if enrollment_result.data and len(enrollment_result.data) > 0:
                enrollment = enrollment_result.data[0]

                if (
                    target_type == "programme"
                    and target_id == enrollment.get("programme_id")
                ):
                    announcements.append(announcement)
                    continue

                if (
                    target_type == "cohort"
                    and target_id == enrollment.get("cohort_id")
                ):
                    announcements.append(announcement)
                    continue

        return announcements[:limit]
