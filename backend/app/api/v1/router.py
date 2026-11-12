"""
Main API v1 router
Aggregates all endpoint routers
"""

from fastapi import APIRouter

# Import endpoint routers
from app.api.v1.endpoints import (
    auth,
    applications,
    enrollments,
    programmes,
    progress,
    announcements,
    quizzes,
    certificates,
    payments,
    admin_dashboard,
    admin_students,
    admin_content,
    admin_announcements,
    admin_enrollments,
    admin_applications,
    admin_quizzes,
    admin_certificates,
    admin_payments,
)


# Create main API router
api_router = APIRouter()


# Placeholder health endpoint
@api_router.get("/ping", tags=["Health"])
async def ping():
    """API health check"""
    return {"message": "pong", "api_version": "v1"}


# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["Enrollments"])
api_router.include_router(programmes.router, prefix="/programmes", tags=["Programmes"])
api_router.include_router(progress.router, prefix="/progress", tags=["Progress"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["Announcements"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])

# Admin routers
api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["Admin - Dashboard"])
api_router.include_router(admin_students.router, prefix="/admin/students", tags=["Admin - Students"])
api_router.include_router(admin_content.router, prefix="/admin/content", tags=["Admin - Content"])
api_router.include_router(admin_announcements.router, prefix="/admin/announcements", tags=["Admin - Announcements"])
api_router.include_router(admin_enrollments.router, prefix="/admin/enrollments", tags=["Admin - Enrollments"])
api_router.include_router(admin_applications.router, prefix="/admin/applications", tags=["Admin - Applications"])
api_router.include_router(admin_quizzes.router, prefix="/admin/quizzes", tags=["Admin - Quizzes"])

api_router.include_router(admin_certificates.router, prefix="/admin/certificates", tags=["Admin - Certificates"])
api_router.include_router(admin_payments.router, prefix="/admin/payments", tags=["Admin - Payments"])
