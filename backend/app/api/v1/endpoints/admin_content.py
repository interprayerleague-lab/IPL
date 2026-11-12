from fastapi import APIRouter, Depends, HTTPException
from app.schemas.admin import (
    ProgrammeCreate,
    ProgrammeUpdate,
    ModuleCreate,
    ModuleUpdate,
    LessonCreate,
    LessonUpdate,
    ResourceCreate,
    ResourceUpdate,
    CohortCreate,
    CohortUpdate,
)
from app.services.content_service import ContentService
from app.services.admin_service import AdminService
from app.core.dependencies import AdminUserId

router = APIRouter()


# PROGRAMMES
@router.post("/programmes")
def create_programme(
    data: ProgrammeCreate,
    admin_id: str = Depends(AdminUserId),
):
    """Create new programme. Admin only."""
    try:
        programme = ContentService.create_programme(data.dict(), admin_id)
        AdminService.log_action(
            admin_id, "create_programme", "programme", programme["id"]
        )
        return programme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/programmes/{programme_id}")
def update_programme(
    programme_id: str,
    data: ProgrammeUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """Update programme. Admin only."""
    try:
        programme = ContentService.update_programme(
            programme_id, data.dict(exclude_unset=True)
        )
        AdminService.log_action(
            admin_id, "update_programme", "programme", programme_id
        )
        return programme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/programmes/{programme_id}")
def delete_programme(
    programme_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """Delete programme. Admin only."""
    try:
        success = ContentService.delete_programme(programme_id)
        if success:
            AdminService.log_action(
                admin_id, "delete_programme", "programme", programme_id
            )
            return {"message": "Programme deleted successfully"}
        raise HTTPException(status_code=404, detail="Programme not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# MODULES
@router.post("/modules")
def create_module(
    data: ModuleCreate,
    admin_id: str = Depends(AdminUserId),
):
    """Create new module. Admin only."""
    try:
        module = ContentService.create_module(data.dict())
        AdminService.log_action(admin_id, "create_module", "module", module["id"])
        return module
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/modules/{module_id}")
def update_module(
    module_id: str,
    data: ModuleUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """Update module. Admin only."""
    try:
        module = ContentService.update_module(module_id, data.dict(exclude_unset=True))
        AdminService.log_action(admin_id, "update_module", "module", module_id)
        return module
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/modules/{module_id}")
def delete_module(
    module_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """Delete module. Admin only."""
    try:
        success = ContentService.delete_module(module_id)
        if success:
            AdminService.log_action(admin_id, "delete_module", "module", module_id)
            return {"message": "Module deleted successfully"}
        raise HTTPException(status_code=404, detail="Module not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# LESSONS
@router.post("/lessons")
def create_lesson(
    data: LessonCreate,
    admin_id: str = Depends(AdminUserId),
):
    """Create new lesson. Admin only."""
    try:
        lesson = ContentService.create_lesson(data.dict())
        AdminService.log_action(admin_id, "create_lesson", "lesson", lesson["id"])
        return lesson
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: str,
    data: LessonUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """Update lesson. Admin only."""
    try:
        lesson = ContentService.update_lesson(lesson_id, data.dict(exclude_unset=True))
        AdminService.log_action(admin_id, "update_lesson", "lesson", lesson_id)
        return lesson
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """Delete lesson. Admin only."""
    try:
        success = ContentService.delete_lesson(lesson_id)
        if success:
            AdminService.log_action(admin_id, "delete_lesson", "lesson", lesson_id)
            return {"message": "Lesson deleted successfully"}
        raise HTTPException(status_code=404, detail="Lesson not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# RESOURCES
@router.post("/resources")
def create_resource(
    data: ResourceCreate,
    admin_id: str = Depends(AdminUserId),
):
    """Create new resource. Admin only."""
    try:
        resource = ContentService.create_resource(data.dict())
        AdminService.log_action(admin_id, "create_resource", "resource", resource["id"])
        return resource
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/resources/{resource_id}")
def update_resource(
    resource_id: str,
    data: ResourceUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """Update resource. Admin only."""
    try:
        resource = ContentService.update_resource(
            resource_id, data.dict(exclude_unset=True)
        )
        AdminService.log_action(admin_id, "update_resource", "resource", resource_id)
        return resource
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/resources/{resource_id}")
def delete_resource(
    resource_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """Delete resource. Admin only."""
    try:
        success = ContentService.delete_resource(resource_id)
        if success:
            AdminService.log_action(admin_id, "delete_resource", "resource", resource_id)
            return {"message": "Resource deleted successfully"}
        raise HTTPException(status_code=404, detail="Resource not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# COHORTS
@router.post("/cohorts")
def create_cohort(
    data: CohortCreate,
    admin_id: str = Depends(AdminUserId),
):
    """Create new cohort. Admin only."""
    try:
        cohort = ContentService.create_cohort(data.dict())
        AdminService.log_action(admin_id, "create_cohort", "cohort", cohort["id"])
        return cohort
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/cohorts")
def list_cohorts(
    admin_id: str = Depends(AdminUserId),
):
    """List all cohorts. Admin only."""
    try:
        cohorts = ContentService.get_cohorts()
        return cohorts
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/cohorts/{cohort_id}")
def update_cohort(
    cohort_id: str,
    data: CohortUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """Update cohort. Admin only."""
    try:
        cohort = ContentService.update_cohort(cohort_id, data.dict(exclude_unset=True))
        AdminService.log_action(admin_id, "update_cohort", "cohort", cohort_id)
        return cohort
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
