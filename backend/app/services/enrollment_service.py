from typing import Optional, List
from app.core.database import supabase_admin


class EnrollmentService:
    """Service for managing student enrollments"""

    @staticmethod
    def get_enrollment(enrollment_id: str) -> Optional[dict]:
        """Get enrollment by ID"""
        result = (
            supabase_admin.table("enrollments")
            .select("*")
            .eq("id", enrollment_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    @staticmethod
    def get_student_enrollments(student_id: str) -> List[dict]:
        """Get all enrollments for a student"""
        result = (
            supabase_admin.table("enrollments")
            .select(
                """
                *,
                programmes!inner(id, title, slug),
                cohorts(id, name)
            """
            )
            .eq("student_id", student_id)
            .order("created_at", desc=True)
            .execute()
        )

        # Flatten joined data
        enrollments = []
        for enrollment in result.data or []:
            enrollment["programme_title"] = (
                enrollment["programmes"]["title"] if enrollment.get("programmes") else None
            )
            enrollment["cohort_name"] = (
                enrollment["cohorts"]["name"]
                if enrollment.get("cohorts")
                else None
            )
            enrollments.append(enrollment)

        return enrollments

    @staticmethod
    def get_active_enrollment(student_id: str) -> Optional[dict]:
        """Get student's active enrollment"""
        result = (
            supabase_admin.table("enrollments")
            .select(
                """
                *,
                programmes!inner(id, title, slug),
                cohorts(id, name)
            """
            )
            .eq("student_id", student_id)
            .eq("status", "active")
            .order("enrolled_at", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            return None

        enrollment = result.data[0]
        enrollment["programme_title"] = (
            enrollment["programmes"]["title"] if enrollment.get("programmes") else None
        )
        enrollment["cohort_name"] = (
            enrollment["cohorts"]["name"] if enrollment.get("cohorts") else None
        )

        return enrollment

    @staticmethod
    def has_access_to_programme(student_id: str, programme_id: str) -> bool:
        """Check if student has active enrollment for programme"""
        result = (
            supabase_admin.table("enrollments")
            .select("id")
            .eq("student_id", student_id)
            .eq("programme_id", programme_id)
            .eq("status", "active")
            .execute()
        )

        return len(result.data) > 0 if result.data else False
