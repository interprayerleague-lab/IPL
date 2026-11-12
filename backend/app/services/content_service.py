from typing import Optional, Dict, Any
from datetime import datetime
from app.core.database import supabase_admin


class ContentService:
    """Service for managing programmes, modules, lessons (Admin CRUD)"""

    # PROGRAMMES
    @staticmethod
    def create_programme(data: Dict[str, Any], created_by: str) -> dict:
        """Create new programme"""
        programme_data = {
            **data,
            "created_by": created_by,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("programmes").insert(programme_data).execute()

        if not result.data:
            raise ValueError("Failed to create programme")

        return result.data[0]

    @staticmethod
    def update_programme(programme_id: str, data: Dict[str, Any]) -> dict:
        """Update programme"""
        update_data = {**data, "updated_at": datetime.utcnow().isoformat()}

        result = (
            supabase_admin.table("programmes")
            .update(update_data)
            .eq("id", programme_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update programme")

        return result.data[0]

    @staticmethod
    def delete_programme(programme_id: str) -> bool:
        """Delete programme (cascade will handle modules/lessons)"""
        result = (
            supabase_admin.table("programmes").delete().eq("id", programme_id).execute()
        )

        return len(result.data) > 0 if result.data else False

    # MODULES
    @staticmethod
    def create_module(data: Dict[str, Any]) -> dict:
        """Create new module"""
        module_data = {
            **data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("modules").insert(module_data).execute()

        if not result.data:
            raise ValueError("Failed to create module")

        return result.data[0]

    @staticmethod
    def update_module(module_id: str, data: Dict[str, Any]) -> dict:
        """Update module"""
        update_data = {**data, "updated_at": datetime.utcnow().isoformat()}

        result = (
            supabase_admin.table("modules")
            .update(update_data)
            .eq("id", module_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update module")

        return result.data[0]

    @staticmethod
    def delete_module(module_id: str) -> bool:
        """Delete module"""
        result = supabase_admin.table("modules").delete().eq("id", module_id).execute()

        return len(result.data) > 0 if result.data else False

    # LESSONS
    @staticmethod
    def create_lesson(data: Dict[str, Any]) -> dict:
        """Create new lesson"""
        lesson_data = {
            **data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("lessons").insert(lesson_data).execute()

        if not result.data:
            raise ValueError("Failed to create lesson")

        return result.data[0]

    @staticmethod
    def update_lesson(lesson_id: str, data: Dict[str, Any]) -> dict:
        """Update lesson"""
        update_data = {**data, "updated_at": datetime.utcnow().isoformat()}

        result = (
            supabase_admin.table("lessons")
            .update(update_data)
            .eq("id", lesson_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update lesson")

        return result.data[0]

    @staticmethod
    def delete_lesson(lesson_id: str) -> bool:
        """Delete lesson"""
        result = supabase_admin.table("lessons").delete().eq("id", lesson_id).execute()

        return len(result.data) > 0 if result.data else False

    # RESOURCES
    @staticmethod
    def create_resource(data: Dict[str, Any]) -> dict:
        """Create new resource"""
        resource_data = {
            **data,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("resources").insert(resource_data).execute()

        if not result.data:
            raise ValueError("Failed to create resource")

        return result.data[0]

    @staticmethod
    def update_resource(resource_id: str, data: Dict[str, Any]) -> dict:
        """Update resource"""
        result = (
            supabase_admin.table("resources")
            .update(data)
            .eq("id", resource_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update resource")

        return result.data[0]

    @staticmethod
    def delete_resource(resource_id: str) -> bool:
        """Delete resource"""
        result = supabase_admin.table("resources").delete().eq("id", resource_id).execute()

        return len(result.data) > 0 if result.data else False

    # COHORTS
    @staticmethod
    def create_cohort(data: Dict[str, Any]) -> dict:
        """Create new cohort"""
        cohort_data = {
            **data,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("cohorts").insert(cohort_data).execute()

        if not result.data:
            raise ValueError("Failed to create cohort")

        return result.data[0]

    @staticmethod
    def get_cohorts(branch_id: Optional[str] = None) -> list:
        """Get all cohorts"""
        query = supabase_admin.table("cohorts").select("*").order("created_at", desc=True)

        if branch_id:
            query = query.eq("branch_id", branch_id)

        result = query.execute()
        return result.data or []

    @staticmethod
    def update_cohort(cohort_id: str, data: Dict[str, Any]) -> dict:
        """Update cohort"""
        result = (
            supabase_admin.table("cohorts")
            .update(data)
            .eq("id", cohort_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update cohort")

        return result.data[0]
