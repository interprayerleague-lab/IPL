from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import supabase_admin


class AdminService:
    """Service for admin operations and audit logging"""

    @staticmethod
    def log_action(
        actor_id: str,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> dict:
        """Log admin action to audit_logs table"""
        log_data = {
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("audit_logs").insert(log_data).execute()

        if result.data:
            return result.data[0]
        return {}

    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        """Get overview statistics for admin dashboard"""
        # Total enrolled students
        enrolled_result = (
            supabase_admin.table("enrollments")
            .select("id", count="exact")
            .eq("status", "active")
            .execute()
        )

        # Pending applications
        pending_apps_result = (
            supabase_admin.table("applications")
            .select("id", count="exact")
            .in_("status", ["submitted", "under_review"])
            .execute()
        )

        # Total payments (successful)
        payments_result = (
            supabase_admin.table("payments")
            .select("amount_minor, currency")
            .eq("status", "successful")
            .execute()
        )

        total_revenue = sum(p.get("amount_minor", 0) for p in (payments_result.data or []))

        # Pending payments
        pending_payments_result = (
            supabase_admin.table("payments")
            .select("id", count="exact")
            .eq("status", "pending")
            .execute()
        )

        # Average completion (simplified - count completed vs total enrollments)
        completed_result = (
            supabase_admin.table("enrollments")
            .select("id", count="exact")
            .eq("status", "completed")
            .execute()
        )

        total_enrollments = enrolled_result.count + (completed_result.count or 0)
        avg_completion = (
            round((completed_result.count / total_enrollments) * 100)
            if total_enrollments > 0
            else 0
        )

        return {
            "enrolled_students": enrolled_result.count or 0,
            "pending_applications": pending_apps_result.count or 0,
            "total_revenue_minor": total_revenue,
            "pending_payments": pending_payments_result.count or 0,
            "average_completion_percentage": avg_completion,
        }

    @staticmethod
    def get_students_list(
        search: Optional[str] = None,
        branch_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        """Get paginated student list with filters"""
        query = supabase_admin.table("profiles").select(
            """
            id,
            first_name,
            last_name,
            email,
            phone,
            created_at,
            enrollments!inner(
                id,
                status,
                enrolled_at,
                programme_id,
                programmes(title)
            )
        """
        ).eq("role", "student")

        # Apply filters
        if status:
            query = query.eq("enrollments.status", status)

        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        # Flatten and add progress data
        students = []
        for student in result.data or []:
            # Get progress for each student
            if student.get("enrollments") and len(student["enrollments"]) > 0:
                enrollment = student["enrollments"][0]
                
                # Calculate progress
                progress_result = (
                    supabase_admin.table("lesson_progress")
                    .select("status, lesson_id")
                    .eq("student_id", student["id"])
                    .execute()
                )

                completed_count = sum(
                    1 for p in (progress_result.data or []) if p["status"] == "completed"
                )
                total_count = len(progress_result.data) if progress_result.data else 0

                student["enrollment_status"] = enrollment.get("status")
                student["programme_title"] = (
                    enrollment.get("programmes", {}).get("title")
                    if enrollment.get("programmes")
                    else None
                )
                student["progress_percentage"] = (
                    round((completed_count / total_count) * 100) if total_count > 0 else 0
                )
            else:
                student["enrollment_status"] = None
                student["programme_title"] = None
                student["progress_percentage"] = 0

            students.append(student)

        return students

    @staticmethod
    def get_student_detail(student_id: str) -> Optional[dict]:
        """Get detailed student information"""
        # Get profile
        profile_result = (
            supabase_admin.table("profiles")
            .select("*")
            .eq("id", student_id)
            .single()
            .execute()
        )

        if not profile_result.data:
            return None

        student = profile_result.data

        # Get enrollments
        enrollments_result = (
            supabase_admin.table("enrollments")
            .select(
                """
                *,
                programmes(title, slug),
                cohorts(name)
            """
            )
            .eq("student_id", student_id)
            .execute()
        )

        student["enrollments"] = enrollments_result.data or []

        # Get applications
        applications_result = (
            supabase_admin.table("applications")
            .select("*")
            .eq("student_id", student_id)
            .order("created_at", desc=True)
            .execute()
        )

        student["applications"] = applications_result.data or []

        # Get progress summary
        progress_result = (
            supabase_admin.table("lesson_progress")
            .select("status")
            .eq("student_id", student_id)
            .execute()
        )

        total_lessons = len(progress_result.data) if progress_result.data else 0
        completed_lessons = sum(
            1 for p in (progress_result.data or []) if p["status"] == "completed"
        )

        student["progress_summary"] = {
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "percentage": (
                round((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
            ),
        }

        return student
