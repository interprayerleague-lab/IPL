from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import List, Optional
from app.schemas.payment import (
    PaymentCreate,
    PaymentInitializeResponse,
    PaymentResponse,
    PaymentWebhookPayload,
)
from app.services.payment_service import PaymentService
from app.core.dependencies import StudentUserId

router = APIRouter()


@router.post("/initialize", response_model=PaymentInitializeResponse)
def initialize_payment(
    data: PaymentCreate,
    student_id: str = Depends(StudentUserId),
):
    """
    Initialize payment with Paystack.
    Student only.
    """
    try:
        result = PaymentService.initialize_payment(
            enrollment_id=data.enrollment_id,
            student_id=student_id,
            amount_minor=data.amount_minor,
            currency=data.currency,
            callback_url=data.callback_url,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("", response_model=List[PaymentResponse])
def get_my_payments(
    student_id: str = Depends(StudentUserId),
):
    """
    Get current student's payment history.
    Student only.
    """
    try:
        payments = PaymentService.get_student_payments(student_id)
        return payments
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get payment details.
    Student can only view their own payments.
    """
    try:
        from app.core.database import supabase_admin

        result = (
            supabase_admin.table("payments")
            .select(
                """
                *,
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

        # Verify ownership
        if payment["student_id"] != student_id:
            raise HTTPException(status_code=403, detail="Not authorized")

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


@router.post("/webhook")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
):
    """
    Paystack webhook endpoint.
    Public endpoint - verifies signature.
    """
    try:
        # Get raw body for signature verification
        body = await request.body()

        # Verify signature
        if not x_paystack_signature:
            raise HTTPException(status_code=400, detail="No signature provided")

        if not PaymentService.verify_webhook_signature(body, x_paystack_signature):
            raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse webhook payload
        import json

        payload = json.loads(body.decode("utf-8"))
        event = payload.get("event")
        data = payload.get("data", {})

        # Handle webhook
        result = PaymentService.handle_webhook(event, data)

        if result["success"]:
            return {"status": "success", "message": result["message"]}
        else:
            return {"status": "error", "message": result["message"]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
