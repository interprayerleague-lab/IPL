from datetime import datetime
from typing import Optional, List
from postgrest.exceptions import APIError
from app.core.database import supabase_admin
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationStatus,
)


class ApplicationService:
    """Service for managing student applications"""

    @staticmethod
    def generate_application_number() -> str:
        """Generate unique application number in format APP-YYYYMMDD-XXXX"""
        now = datetime.utcnow()
        date_part = now.strftime("%Y%m%d")

        # Query for today's applications to get next sequence number
        result = (
            supabase_admin.table("applications")
            .select("application_number")
            .like("application_number", f"APP-{date_part}-%")
            .execute()
        )

        sequence = len(result.data) + 1
        return f"APP-{date_part}-{sequence:04d}"

    @staticmethod
    def create_application(student_id: str, data: ApplicationCreate) -> dict:
        """Create a new application in draft status"""
        application_number = ApplicationService.generate_application_number()

        application_data = {
            "student_id": student_id,
            "branch_id": data.branch_id,
            "application_number": application_number,
            "status": ApplicationStatus.DRAFT.value,
            "personal_information": data.personal_information,
            "motivation": data.motivation,
        }

        result = (
            supabase_admin.table("applications").insert(application_data).execute()
        )

        if not result.data:
            raise ValueError("Failed to create application")

        return result.data[0]

    @staticmethod
    def get_application(application_id: str) -> Optional[dict]:
        """Get application by ID"""
        result = (
            supabase_admin.table("applications")
            .select("*")
            .eq("id", application_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    @staticmethod
    def get_student_applications(student_id: str) -> List[dict]:
        """Get all applications for a student"""
        result = (
            supabase_admin.table("applications")
            .select("*")
            .eq("student_id", student_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    @staticmethod
    def update_application(
        application_id: str, student_id: str, data: ApplicationUpdate
    ) -> dict:
        """Update application (only if in draft status and owned by student)"""
        # First verify ownership and status
        existing = ApplicationService.get_application(application_id)
        if not existing:
            raise ValueError("Application not found")

        if existing["student_id"] != student_id:
            raise PermissionError("Not authorized to update this application")

        if existing["status"] != ApplicationStatus.DRAFT.value:
            raise ValueError("Cannot update application after submission")

        # Prepare update data
        update_data = {}
        if data.branch_id is not None:
            update_data["branch_id"] = data.branch_id
        if data.personal_information is not None:
            update_data["personal_information"] = data.personal_information
        if data.motivation is not None:
            update_data["motivation"] = data.motivation

        update_data["updated_at"] = datetime.utcnow().isoformat()

        result = (
            supabase_admin.table("applications")
            .update(update_data)
            .eq("id", application_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update application")

        return result.data[0]

    @staticmethod
    def submit_application(application_id: str, student_id: str) -> dict:
        """Submit application for review"""
        existing = ApplicationService.get_application(application_id)
        if not existing:
            raise ValueError("Application not found")

        if existing["student_id"] != student_id:
            raise PermissionError("Not authorized to submit this application")

        if existing["status"] not in [
            ApplicationStatus.DRAFT.value,
            ApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED.value,
        ]:
            raise ValueError("Application cannot be submitted in current status")

        # Validate required fields
        personal_info = existing["personal_information"]
        required_fields = ["first_name", "last_name", "email", "phone"]
        missing_fields = [f for f in required_fields if not personal_info.get(f)]

        if missing_fields:
            raise ValueError(
                f"Missing required fields: {', '.join(missing_fields)}"
            )

        if not existing["motivation"]:
            raise ValueError("Motivation is required")

        # Update to submitted status
        result = (
            supabase_admin.table("applications")
            .update(
                {
                    "status": ApplicationStatus.SUBMITTED.value,
                    "submitted_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                }
            )
            .eq("id", application_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to submit application")

        return result.data[0]

    @staticmethod
    def review_application(
        application_id: str, admin_id: str, status: str, review_notes: Optional[str]
    ) -> dict:
        """Admin reviews and updates application status"""
        existing = ApplicationService.get_application(application_id)
        if not existing:
            raise ValueError("Application not found")

        # Validate status transition
        valid_review_statuses = [
            ApplicationStatus.UNDER_REVIEW.value,
            ApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED.value,
            ApplicationStatus.APPROVED.value,
            ApplicationStatus.REJECTED.value,
        ]

        if status not in valid_review_statuses:
            raise ValueError(f"Invalid review status: {status}")

        result = (
            supabase_admin.table("applications")
            .update(
                {
                    "status": status,
                    "reviewed_by": admin_id,
                    "reviewed_at": datetime.utcnow().isoformat(),
                    "review_notes": review_notes,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            )
            .eq("id", application_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update application")

        return result.data[0]

    @staticmethod
    def list_applications(
        status: Optional[str] = None,
        branch_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        """Admin lists all applications with optional filters"""
        query = supabase_admin.table("applications").select("*")

        if status:
            query = query.eq("status", status)
        if branch_id:
            query = query.eq("branch_id", branch_id)

        result = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        return result.data
