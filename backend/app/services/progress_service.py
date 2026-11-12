from datetime import datetime
from typing import Optional, List
from app.core.database import supabase_admin
from app.schemas.progress import ProgressStatus


class ProgressService:
    """Service for managing student lesson progress"""

    @staticmethod
    def get_lesson_progress(student_id: str, lesson_id: str) -> Optional[dict]:
        """Get progress for a specific lesson"""
        result = (
            supabase_admin.table("lesson_progress")
            .select("*")
            .eq("student_id", student_id)
            .eq("lesson_id", lesson_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    @staticmethod
    def get_student_progress(student_id: str) -> List[dict]:
        """Get all progress records for a student"""
        result = (
            supabase_admin.table("lesson_progress")
            .select("*")
            .eq("student_id", student_id)
            .execute()
        )
        return result.data

    @staticmethod
    def update_progress(
        student_id: str,
        lesson_id: str,
        status: str,
        progress_percentage: int,
    ) -> dict:
        """Update or create lesson progress"""
        now = datetime.utcnow().isoformat()

        # Check if progress record exists
        existing = ProgressService.get_lesson_progress(student_id, lesson_id)

        progress_data = {
            "student_id": student_id,
            "lesson_id": lesson_id,
            "status": status,
            "progress_percentage": progress_percentage,
            "last_accessed_at": now,
            "updated_at": now,
        }

        # Set started_at if transitioning from not_started
        if not existing or existing["status"] == ProgressStatus.NOT_STARTED.value:
            if status in [ProgressStatus.IN_PROGRESS.value, ProgressStatus.COMPLETED.value]:
                progress_data["started_at"] = now

        # Set completed_at if marking as completed
        if status == ProgressStatus.COMPLETED.value:
            progress_data["completed_at"] = now
            progress_data["progress_percentage"] = 100

        if existing:
            # Update existing record
            result = (
                supabase_admin.table("lesson_progress")
                .update(progress_data)
                .eq("student_id", student_id)
                .eq("lesson_id", lesson_id)
                .execute()
            )
        else:
            # Create new record
            result = (
                supabase_admin.table("lesson_progress")
                .insert(progress_data)
                .execute()
            )

        if not result.data:
            raise ValueError("Failed to update progress")

        return result.data[0]

    @staticmethod
    def get_module_progress_summary(student_id: str, module_id: str) -> dict:
        """Get progress summary for a module"""
        # Get all lessons in the module
        lessons_result = (
            supabase_admin.table("lessons")
            .select("id")
            .eq("module_id", module_id)
            .execute()
        )

        total_lessons = len(lessons_result.data) if lessons_result.data else 0

        if total_lessons == 0:
            return {"total": 0, "completed": 0, "percentage": 0}

        # Get completed lessons
        lesson_ids = [lesson["id"] for lesson in lessons_result.data]

        progress_result = (
            supabase_admin.table("lesson_progress")
            .select("id")
            .eq("student_id", student_id)
            .eq("status", ProgressStatus.COMPLETED.value)
            .in_("lesson_id", lesson_ids)
            .execute()
        )

        completed_lessons = len(progress_result.data) if progress_result.data else 0

        return {
            "total": total_lessons,
            "completed": completed_lessons,
            "percentage": round((completed_lessons / total_lessons) * 100),
        }
