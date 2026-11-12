from typing import Optional, List
from datetime import datetime
from app.core.database import supabase_admin
from app.services.certificate_generator import generate_certificate_pdf


class CertificateService:
    """Service for certificate issuance and management"""

    @staticmethod
    def generate_certificate_number() -> str:
        """Generate unique certificate number in format CERT-YYYY-NNNN"""
        now = datetime.utcnow()
        year = now.strftime("%Y")

        # Get count of certificates this year
        result = (
            supabase_admin.table("certificates")
            .select("certificate_number")
            .like("certificate_number", f"CERT-{year}-%")
            .execute()
        )

        sequence = len(result.data) + 1
        return f"CERT-{year}-{sequence:04d}"

    @staticmethod
    def check_eligibility(enrollment_id: str) -> dict:
        """Check if student is eligible for certificate"""
        # Get enrollment
        enrollment_result = (
            supabase_admin.table("enrollments")
            .select(
                """
                *,
                student_id,
                programme_id,
                programmes!inner(id)
            """
            )
            .eq("id", enrollment_id)
            .single()
            .execute()
        )

        if not enrollment_result.data:
            return {
                "is_eligible": False,
                "reason": "Enrollment not found",
                "completion_percentage": 0,
                "completed_modules": 0,
                "total_modules": 0,
                "total_lessons": 0,
                "completed_lessons": 0,
                "total_quizzes": 0,
                "passed_quizzes": 0,
            }

        enrollment = enrollment_result.data
        student_id = enrollment["student_id"]
        programme_id = enrollment["programme_id"]

        # Get all modules in the programme
        modules_result = (
            supabase_admin.table("modules")
            .select("id")
            .eq("programme_id", programme_id)
            .eq("is_published", True)
            .execute()
        )

        total_modules = len(modules_result.data) if modules_result.data else 0

        if total_modules == 0:
            return {
                "is_eligible": False,
                "reason": "No modules in programme",
                "completion_percentage": 0,
                "completed_modules": 0,
                "total_modules": 0,
                "total_lessons": 0,
                "completed_lessons": 0,
                "total_quizzes": 0,
                "passed_quizzes": 0,
            }

        # Check each module for completion
        completed_modules = 0
        total_lessons = 0
        completed_lessons = 0
        total_quizzes = 0
        passed_quizzes = 0

        for module in modules_result.data:
            # Get all required lessons in module
            lessons_result = (
                supabase_admin.table("lessons")
                .select("id")
                .eq("module_id", module["id"])
                .eq("is_required", True)
                .eq("is_published", True)
                .execute()
            )

            required_lessons = lessons_result.data or []
            total_lessons += len(required_lessons)

            if len(required_lessons) == 0:
                # No required lessons, module is considered complete
                completed_modules += 1
                continue

            # Check if all required lessons are completed
            lesson_ids = [lesson["id"] for lesson in required_lessons]

            progress_result = (
                supabase_admin.table("lesson_progress")
                .select("id")
                .eq("student_id", student_id)
                .eq("status", "completed")
                .in_("lesson_id", lesson_ids)
                .execute()
            )

            completed_count = len(progress_result.data) if progress_result.data else 0
            completed_lessons += completed_count

            if completed_count >= len(required_lessons):
                # Check if module quiz passed (if quiz exists)
                quiz_result = (
                    supabase_admin.table("quizzes")
                    .select("id")
                    .in_(
                        "lesson_id",
                        [lesson["id"] for lesson in required_lessons],
                    )
                    .execute()
                )

                if quiz_result.data and len(quiz_result.data) > 0:
                    total_quizzes += len(quiz_result.data)

                    # Check for passed attempt
                    for quiz in quiz_result.data:
                        quiz_id = quiz["id"]
                        attempt_result = (
                            supabase_admin.table("quiz_attempts")
                            .select("id")
                            .eq("quiz_id", quiz_id)
                            .eq("student_id", student_id)
                            .eq("passed", True)
                            .limit(1)
                            .execute()
                        )

                        if attempt_result.data and len(attempt_result.data) > 0:
                            passed_quizzes += 1

                    if passed_quizzes >= len(quiz_result.data):
                        completed_modules += 1
                else:
                    # No quiz required, just lessons
                    completed_modules += 1

        completion_percentage = round((completed_modules / total_modules) * 100) if total_modules > 0 else 0
        is_eligible = completed_modules == total_modules

        return {
            "is_eligible": is_eligible,
            "reason": None if is_eligible else f"Only {completed_modules}/{total_modules} modules completed",
            "completion_percentage": completion_percentage,
            "completed_modules": completed_modules,
            "total_modules": total_modules,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "total_quizzes": total_quizzes,
            "passed_quizzes": passed_quizzes,
        }

    @staticmethod
    def issue_certificate(enrollment_id: str, issued_by: str) -> dict:
        """Issue certificate for completed enrollment"""
        # Check eligibility
        eligibility = CertificateService.check_eligibility(enrollment_id)

        if not eligibility["is_eligible"]:
            raise ValueError(f"Not eligible: {eligibility['reason']}")

        # Check if certificate already exists
        existing_result = (
            supabase_admin.table("certificates")
            .select("id")
            .eq("enrollment_id", enrollment_id)
            .eq("status", "issued")
            .execute()
        )

        if existing_result.data and len(existing_result.data) > 0:
            raise ValueError("Certificate already issued for this enrollment")

        # Get enrollment and student data
        enrollment_result = (
            supabase_admin.table("enrollments")
            .select(
                """
                student_id,
                programme_id,
                profiles!inner(first_name, last_name),
                programmes!inner(title)
            """
            )
            .eq("id", enrollment_id)
            .single()
            .execute()
        )

        if not enrollment_result.data:
            raise ValueError("Enrollment not found")

        enrollment = enrollment_result.data

        # Generate certificate number
        certificate_number = CertificateService.generate_certificate_number()

        # Generate student full name and programme title
        student_name = f"{enrollment['profiles']['first_name']} {enrollment['profiles']['last_name']}"
        programme_title = enrollment["programmes"]["title"]

        # Generate PDF certificate
        issue_date = datetime.utcnow()
        pdf_buffer = generate_certificate_pdf(
            student_name=student_name,
            programme_title=programme_title,
            certificate_number=certificate_number,
            issue_date=issue_date,
        )

        # Upload to Supabase Storage
        file_path = f"certificates/{enrollment['student_id']}/{certificate_number}.pdf"

        try:
            # Upload PDF to storage
            supabase_admin.storage.from_("certificates").upload(
                file_path,
                pdf_buffer.getvalue(),
                {
                    "content-type": "application/pdf",
                    "cache-control": "3600",
                },
            )
        except Exception as e:
            # If upload fails, continue without file_path
            # Certificate record will still be created
            file_path = None
            print(f"Warning: Failed to upload certificate PDF: {e}")

        # Create certificate record
        certificate_data = {
            "enrollment_id": enrollment_id,
            "student_id": enrollment["student_id"],
            "certificate_number": certificate_number,
            "issued_at": issue_date.isoformat(),
            "status": "issued",
            "file_path": file_path,
            "created_at": issue_date.isoformat(),
        }

        result = supabase_admin.table("certificates").insert(certificate_data).execute()

        if not result.data:
            raise ValueError("Failed to create certificate")

        certificate = result.data[0]

        # Update enrollment status to completed
        supabase_admin.table("enrollments").update(
            {
                "status": "completed",
                "completed_at": issue_date.isoformat(),
            }
        ).eq("id", enrollment_id).execute()

        return certificate

    @staticmethod
    def revoke_certificate(certificate_id: str, revoked_by: str, reason: Optional[str] = None) -> dict:
        """Revoke certificate"""
        result = (
            supabase_admin.table("certificates")
            .update({"status": "revoked"})
            .eq("id", certificate_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Certificate not found")

        return result.data[0]

    @staticmethod
    def get_student_certificates(student_id: str) -> List[dict]:
        """Get all certificates for a student"""
        result = (
            supabase_admin.table("certificates")
            .select(
                """
                *,
                enrollments!inner(
                    programmes!inner(title)
                )
            """
            )
            .eq("student_id", student_id)
            .order("issued_at", desc=True)
            .execute()
        )

        certificates = []
        for cert in result.data or []:
            cert["programme_title"] = (
                cert["enrollments"]["programmes"]["title"]
                if cert.get("enrollments") and cert["enrollments"].get("programmes")
                else None
            )
            certificates.append(cert)

        return certificates

    @staticmethod
    def get_certificate(certificate_id: str) -> Optional[dict]:
        """Get certificate by ID"""
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
            .eq("id", certificate_id)
            .single()
            .execute()
        )

        if not result.data:
            return None

        certificate = result.data
        certificate["student_name"] = (
            f"{certificate['profiles']['first_name']} {certificate['profiles']['last_name']}"
            if certificate.get("profiles")
            else None
        )
        certificate["programme_title"] = (
            certificate["enrollments"]["programmes"]["title"]
            if certificate.get("enrollments") and certificate["enrollments"].get("programmes")
            else None
        )

        return certificate
