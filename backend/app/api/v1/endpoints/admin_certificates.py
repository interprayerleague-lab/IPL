from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.schemas.certificate import CertificateCreate, CertificateResponse, CertificateEligibility
from app.services.certificate_service import CertificateService
from app.services.admin_service import AdminService
from app.core.dependencies import AdminUserId

router = APIRouter()


@router.post("/issue", response_model=CertificateResponse, status_code=201)
def issue_certificate(
    data: CertificateCreate,
    admin_id: str = Depends(AdminUserId),
):
    """
    Issue certificate for completed enrollment.
    Admin only.
    """
    try:
        certificate = CertificateService.issue_certificate(
            data.enrollment_id, admin_id
        )

        # Log action
        AdminService.log_action(
            admin_id,
            "issue_certificate",
            "certificate",
            certificate["id"],
            {
                "enrollment_id": data.enrollment_id,
                "certificate_number": certificate["certificate_number"],
            },
        )

        return certificate
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{certificate_id}/revoke", response_model=CertificateResponse)
def revoke_certificate(
    certificate_id: str,
    reason: Optional[str] = None,
    admin_id: str = Depends(AdminUserId),
):
    """
    Revoke certificate.
    Admin only.
    """
    try:
        certificate = CertificateService.revoke_certificate(
            certificate_id, admin_id, reason
        )

        # Log action
        AdminService.log_action(
            admin_id,
            "revoke_certificate",
            "certificate",
            certificate_id,
            {"reason": reason},
        )

        return certificate
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/enrollments/{enrollment_id}/eligibility", response_model=CertificateEligibility)
def check_eligibility(
    enrollment_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """
    Check certificate eligibility for enrollment.
    Admin only.
    """
    try:
        eligibility = CertificateService.check_eligibility(enrollment_id)
        return eligibility
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/eligible")
def get_eligible_students(
    admin_id: str = Depends(AdminUserId),
):
    """
    Get students eligible for certification.
    Admin only.
    """
    try:
        from app.core.database import supabase_admin

        # Get all active enrollments
        result = (
            supabase_admin.table("enrollments")
            .select(
                """
                id,
                student_id,
                programme_id,
                status,
                profiles!inner(first_name, last_name),
                programmes!inner(title)
            """
            )
            .eq("status", "active")
            .execute()
        )

        eligible_students = []
        for enrollment in result.data or []:
            # Check eligibility for each enrollment
            eligibility = CertificateService.check_eligibility(enrollment["id"])

            eligible_students.append(
                {
                    "enrollment_id": enrollment["id"],
                    "student_id": enrollment["student_id"],
                    "student_name": f"{enrollment['profiles']['first_name']} {enrollment['profiles']['last_name']}",
                    "programme_title": enrollment["programmes"]["title"],
                    "is_eligible": eligibility["is_eligible"],
                    "total_lessons": eligibility["total_lessons"],
                    "completed_lessons": eligibility["completed_lessons"],
                    "total_quizzes": eligibility["total_quizzes"],
                    "passed_quizzes": eligibility["passed_quizzes"],
                }
            )

        return eligible_students
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("")
def list_certificates(
    student_id: Optional[str] = None,
    admin_id: str = Depends(AdminUserId),
):
    """
    List all certificates (optionally filtered by student).
    Admin only.
    """
    try:
        if student_id:
            certificates = CertificateService.get_student_certificates(student_id)
        else:
            # Get all certificates
            from app.core.database import supabase_admin

            result = (
                supabase_admin.table("certificates")
                .select(
                    """
                    *,
                    profiles!inner(first_name, last_name),
                    enrollments!inner(
                        programmes!inner(title)
                    )
                """
                )
                .order("issued_at", desc=True)
                .execute()
            )

            certificates = []
            for cert in result.data or []:
                cert["student_name"] = (
                    f"{cert['profiles']['first_name']} {cert['profiles']['last_name']}"
                    if cert.get("profiles")
                    else None
                )
                cert["programme_title"] = (
                    cert["enrollments"]["programmes"]["title"]
                    if cert.get("enrollments")
                    and cert["enrollments"].get("programmes")
                    else None
                )
                certificates.append(cert)

        return certificates
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
