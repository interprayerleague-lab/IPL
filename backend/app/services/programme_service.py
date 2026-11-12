from typing import Optional, List
from app.core.database import supabase_admin


class ProgrammeService:
    """Service for managing programmes, modules, and lessons"""

    @staticmethod
    def get_programme(programme_id: str) -> Optional[dict]:
        """Get programme by ID"""
        result = (
            supabase_admin.table("programmes")
            .select("*")
            .eq("id", programme_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    @staticmethod
    def get_published_programmes() -> List[dict]:
        """Get all published programmes"""
        result = (
            supabase_admin.table("programmes")
            .select("*")
            .eq("is_published", True)
            .order("created_at")
            .execute()
        )
        return result.data

    @staticmethod
    def get_programme_modules(
        programme_id: str, include_unpublished: bool = False
    ) -> List[dict]:
        """Get all modules for a programme"""
        query = (
            supabase_admin.table("modules")
            .select("*")
            .eq("programme_id", programme_id)
            .order("sequence_number")
        )

        if not include_unpublished:
            query = query.eq("is_published", True)

        result = query.execute()
        return result.data

    @staticmethod
    def get_module(module_id: str) -> Optional[dict]:
        """Get module by ID"""
        result = (
            supabase_admin.table("modules")
            .select("*")
            .eq("id", module_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    @staticmethod
    def get_module_by_slug(programme_id: str, module_slug: str) -> Optional[dict]:
        """Get module by programme ID and slug"""
        result = (
            supabase_admin.table("modules")
            .select("*")
            .eq("programme_id", programme_id)
            .eq("slug", module_slug)
            .single()
            .execute()
        )
        return result.data if result.data else None

    @staticmethod
    def get_module_lessons(
        module_id: str, include_unpublished: bool = False
    ) -> List[dict]:
        """Get all lessons for a module"""
        query = (
            supabase_admin.table("lessons")
            .select("*")
            .eq("module_id", module_id)
            .order("sequence_number")
        )

        if not include_unpublished:
            query = query.eq("is_published", True)

        result = query.execute()
        return result.data

    @staticmethod
    def get_lesson(lesson_id: str) -> Optional[dict]:
        """Get lesson by ID"""
        result = (
            supabase_admin.table("lessons")
            .select("*")
            .eq("id", lesson_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    @staticmethod
    def get_lesson_resources(lesson_id: str) -> List[dict]:
        """Get all resources for a lesson"""
        result = (
            supabase_admin.table("resources")
            .select("*")
            .eq("lesson_id", lesson_id)
            .order("created_at")
            .execute()
        )
        return result.data

    @staticmethod
    def get_programme_with_modules_and_lessons(
        programme_id: str, student_id: Optional[str] = None
    ) -> Optional[dict]:
        """Get full programme tree with progress"""
        programme = ProgrammeService.get_programme(programme_id)
        if not programme:
            return None

        modules = ProgrammeService.get_programme_modules(programme_id)

        # Fetch student progress if student_id provided
        progress_map = {}
        if student_id:
            progress_result = (
                supabase_admin.table("lesson_progress")
                .select("lesson_id, status, progress_percentage, completed_at")
                .eq("student_id", student_id)
                .execute()
            )
            progress_map = {
                p["lesson_id"]: p for p in (progress_result.data or [])
            }

        for module in modules:
            lessons = ProgrammeService.get_module_lessons(module["id"])

            # Attach progress to each lesson
            completed_count = 0
            for lesson in lessons:
                progress = progress_map.get(lesson["id"], {})
                lesson["progress_status"] = progress.get("status")
                lesson["progress_percentage"] = progress.get("progress_percentage", 0)
                lesson["completed_at"] = progress.get("completed_at")

                if progress.get("status") == "completed":
                    completed_count += 1

            module["lessons"] = lessons
            module["total_lessons"] = len(lessons)
            module["completed_lessons"] = completed_count

        programme["modules"] = modules
        programme["total_modules"] = len(modules)
        programme["completed_modules"] = sum(
            1 for m in modules if m["completed_lessons"] == m["total_lessons"] and m["total_lessons"] > 0
        )

        return programme
