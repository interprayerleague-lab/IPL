from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.schemas.payment import (
    PaymentResponse,
    PaymentVerifyResponse,
    PaymentStatusUpdate,
)
from app.services.payment_service import PaymentService
from app.services.admin_service import AdminService
from app.core.dependencies import AdminUserId

router = APIRouter()


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    status: Optional[str] = Query(None, description="Filter by status"),
    student_id: Optional[str] = Query(None, description="Filter by student"),
    limit: int = Query(100, le=500, description="Number of results"),
    admin_id: str = Depends(AdminUserId),
):
    """
    List all payments with optional filters.
    Admin only.
    """
    try:
        payments = PaymentService.get_all_payments(
            status=status, student_id=student_id, limit=limit
        )
        return payments
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """
    Get payment details.
    Admin only.
    """
    try:
        from app.core.database import supabase_admin

        result = (
            supabase_admin.table("payments")
            .select(
                """
                *,
                profiles!inner(first_name, last_name),
                enrollments!inner(
                    programmes!inner(title)
                )
            """
            )
            .eq("id", payment_id)
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Payment not found")

        payment = result.data
        payment["student_name"] = (
            f"{payment['profiles']['first_name']} {payment['profiles']['last_name']}"
            if payment.get("profiles")
            else None
        )
        payment["programme_title"] = (
            payment["enrollments"]["programmes"]["title"]
            if payment.get("enrollments") and payment["enrollments"].get("programmes")
            else None
        )

        return payment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{payment_id}/verify", response_model=PaymentVerifyResponse)
def verify_payment(
    payment_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """
    Manually verify payment with Paystack API.
    Admin only.
    """
    try:
        from app.core.database import supabase_admin

        # Get payment
        payment_result = (
            supabase_admin.table("payments")
            .select("*")
            .eq("id", payment_id)
            .single()
            .execute()
        )

        if not payment_result.data:
            raise HTTPException(status_code=404, detail="Payment not found")

        payment = payment_result.data
        reference = payment["provider_reference"]

        # Verify with Paystack
        try:
            verification = PaymentService.verify_payment_with_paystack(reference)

            if verification.get("status") == "success":
                # Update payment
                from datetime import datetime

                update_data = {
                    "status": "successful",
                    "verified_at": datetime.utcnow().isoformat(),
                    "paid_at": verification.get("paid_at")
                    or datetime.utcnow().isoformat(),
                }

                supabase_admin.table("payments").update(update_data).eq(
                    "id", payment_id
                ).execute()

                # Log action
                AdminService.log_action(
                    admin_id,
                    "verify_payment",
                    "payment",
                    payment_id,
                    {"reference": reference, "verification": "manual"},
                )

                return PaymentVerifyResponse(
                    verified=True,
                    status="successful",
                    message="Payment verified successfully",
                    amount_minor=verification.get("amount"),
                    paid_at=verification.get("paid_at"),
                )
            else:
                return PaymentVerifyResponse(
                    verified=False,
                    status="failed",
                    message="Payment verification failed with Paystack",
                )

        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{payment_id}/status", response_model=PaymentResponse)
def update_payment_status(
    payment_id: str,
    data: PaymentStatusUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """
    Update payment status manually.
    Admin only - use with caution.
    """
    try:
        payment = PaymentService.update_payment_status(
            payment_id=payment_id, status=data.status.value, reason=data.reason
        )

        # Log action
        AdminService.log_action(
            admin_id,
            "update_payment_status",
            "payment",
            payment_id,
            {"new_status": data.status.value, "reason": data.reason},
        )

        return payment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
