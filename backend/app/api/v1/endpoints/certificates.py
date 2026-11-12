from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.certificate import CertificateResponse, CertificateEligibility
from app.services.certificate_service import CertificateService
from app.core.dependencies import StudentUserId

router = APIRouter()


@router.get("", response_model=List[CertificateResponse])
def get_my_certificates(
    student_id: str = Depends(StudentUserId),
):
    """
    Get current student's certificates.
    Student only.
    """
    try:
        certificates = CertificateService.get_student_certificates(student_id)
        return certificates
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{certificate_id}", response_model=CertificateResponse)
def get_certificate(
    certificate_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get certificate details.
    Student can only view their own certificates.
    """
    try:
        certificate = CertificateService.get_certificate(certificate_id)
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")

        # Verify ownership
        if certificate["student_id"] != student_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        return certificate
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/enrollments/{enrollment_id}/eligibility", response_model=CertificateEligibility)
def check_certificate_eligibility(
    enrollment_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Check if student is eligible for certificate.
    Student only.
    """
    try:
        # Verify enrollment ownership
        from app.services.enrollment_service import EnrollmentService

        enrollment = EnrollmentService.get_enrollment(enrollment_id)
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")

        if enrollment["student_id"] != student_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        eligibility = CertificateService.check_eligibility(enrollment_id)
        return eligibility
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{certificate_id}/download")
def download_certificate(
    certificate_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Download certificate file.
    Student can only download their own certificates.
    """
    try:
        from fastapi.responses import StreamingResponse
        from app.core.database import supabase_admin
        import io

        certificate = CertificateService.get_certificate(certificate_id)
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")

        # Verify ownership
        if certificate["student_id"] != student_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Verify certificate is issued
        if certificate["status"] != "issued":
            raise HTTPException(status_code=403, detail="Certificate is not available for download")

        # Check if file_path exists
        if not certificate.get("file_path"):
            raise HTTPException(status_code=404, detail="Certificate file not found")

        # Download from Supabase Storage
        try:
            file_data = supabase_admin.storage.from_("certificates").download(
                certificate["file_path"]
            )

            return StreamingResponse(
                io.BytesIO(file_data),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="Certificate-{certificate["certificate_number"]}.pdf"'
                },
            )
        except Exception as storage_error:
            print(f"Storage download error: {storage_error}")
            raise HTTPException(status_code=404, detail="Certificate file not found in storage")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Download error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
