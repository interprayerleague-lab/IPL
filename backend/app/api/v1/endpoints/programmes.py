from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.programme import (
    ProgrammeResponse,
    ModuleResponse,
    LessonResponse,
)
from app.services.programme_service import ProgrammeService
from app.services.enrollment_service import EnrollmentService
from app.core.dependencies import StudentUserId

router = APIRouter()


@router.get("", response_model=List[ProgrammeResponse])
def list_published_programmes():
    """
    List all published programmes (public).
    """
    try:
        programmes = ProgrammeService.get_published_programmes()
        return programmes
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{programme_id}", response_model=ProgrammeResponse)
def get_programme_with_progress(
    programme_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get programme with modules, lessons, and student progress.
    Student must have active enrollment.
    """
    try:
        # Check enrollment access
        has_access = EnrollmentService.has_access_to_programme(
            student_id, programme_id
        )
        if not has_access:
            raise HTTPException(
                status_code=403,
                detail="No active enrollment for this programme",
            )

        programme = ProgrammeService.get_programme_with_modules_and_lessons(
            programme_id, student_id
        )

        if not programme:
            raise HTTPException(status_code=404, detail="Programme not found")

        return programme
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{programme_id}/modules/{module_slug}", response_model=ModuleResponse)
def get_module_with_lessons(
    programme_id: str,
    module_slug: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get module with lessons and progress.
    """
    try:
        # Check enrollment access
        has_access = EnrollmentService.has_access_to_programme(
            student_id, programme_id
        )
        if not has_access:
            raise HTTPException(
                status_code=403,
                detail="No active enrollment for this programme",
            )

        module = ProgrammeService.get_module_by_slug(programme_id, module_slug)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")

        # Get lessons with progress
        lessons = ProgrammeService.get_module_lessons(module["id"])

        # Fetch student progress
        from app.services.progress_service import ProgressService

        progress_list = ProgressService.get_student_progress(student_id)
        progress_map = {p["lesson_id"]: p for p in progress_list}

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

        return module
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get lesson details with resources.
    """
    try:
        lesson = ProgrammeService.get_lesson(lesson_id)
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Check enrollment access via module -> programme
        module = ProgrammeService.get_module(lesson["module_id"])
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")

        has_access = EnrollmentService.has_access_to_programme(
            student_id, module["programme_id"]
        )
        if not has_access:
            raise HTTPException(
                status_code=403,
                detail="No active enrollment for this programme",
            )

        # Get student progress for this lesson
        from app.services.progress_service import ProgressService

        progress = ProgressService.get_lesson_progress(student_id, lesson_id)
        if progress:
            lesson["progress_status"] = progress["status"]
            lesson["progress_percentage"] = progress["progress_percentage"]
            lesson["completed_at"] = progress.get("completed_at")

        # Get resources
        resources = ProgrammeService.get_lesson_resources(lesson_id)
        lesson["resources"] = resources

        return lesson
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
