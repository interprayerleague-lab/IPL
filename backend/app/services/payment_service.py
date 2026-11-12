"""
Payment Service
Handles Paystack integration, webhook verification, and payment management
"""

import hmac
import hashlib
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.config import settings
from app.core.database import supabase_admin


class PaymentService:
    """Service for payment processing with Paystack"""
    
    PAYSTACK_BASE_URL = "https://api.paystack.co"
    
    @staticmethod
    def initialize_payment(
        enrollment_id: str,
        student_id: str,
        amount_minor: int,
        currency: str = "NGN",
        callback_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initialize payment with Paystack
        
        Args:
            enrollment_id: Enrollment ID
            student_id: Student ID
            amount_minor: Amount in minor units (kobo)
            currency: Currency code (default NGN)
            callback_url: URL to redirect after payment
            
        Returns:
            Dict with payment_id, authorization_url, access_code, reference
        """
        # Get student and enrollment details
        enrollment_result = (
            supabase_admin.table("enrollments")
            .select(
                """
                *,
                profiles!inner(first_name, last_name, email),
                programmes!inner(title)
            """
            )
            .eq("id", enrollment_id)
            .eq("student_id", student_id)
            .single()
            .execute()
        )
        
        if not enrollment_result.data:
            raise ValueError("Enrollment not found or unauthorized")
        
        enrollment = enrollment_result.data
        student_email = enrollment["profiles"]["email"]
        student_name = f"{enrollment['profiles']['first_name']} {enrollment['profiles']['last_name']}"
        programme_title = enrollment["programmes"]["title"]
        
        # Generate unique reference
        reference = f"SOD-{enrollment_id[:8]}-{int(datetime.utcnow().timestamp())}"
        
        # Create payment record in database (pending)
        payment_data = {
            "enrollment_id": enrollment_id,
            "student_id": student_id,
            "amount_minor": amount_minor,
            "currency": currency,
            "provider": "paystack",
            "provider_reference": reference,
            "status": "pending",
            "metadata": {
                "student_name": student_name,
                "student_email": student_email,
                "programme_title": programme_title,
            },
            "created_at": datetime.utcnow().isoformat(),
        }
        
        payment_result = supabase_admin.table("payments").insert(payment_data).execute()
        
        if not payment_result.data:
            raise ValueError("Failed to create payment record")
        
        payment = payment_result.data[0]
        
        # Initialize transaction with Paystack
        paystack_payload = {
            "email": student_email,
            "amount": amount_minor,  # Amount in kobo
            "currency": currency,
            "reference": reference,
            "callback_url": callback_url or f"{settings.BACKEND_CORS_ORIGINS[0]}/payment/callback",
            "metadata": {
                "enrollment_id": enrollment_id,
                "student_id": student_id,
                "payment_id": payment["id"],
                "programme_title": programme_title,
            },
        }
        
        try:
            response = requests.post(
                f"{PaymentService.PAYSTACK_BASE_URL}/transaction/initialize",
                json=paystack_payload,
                headers={
                    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            
            response.raise_for_status()
            paystack_response = response.json()
            
            if not paystack_response.get("status"):
                raise ValueError(paystack_response.get("message", "Paystack initialization failed"))
            
            data = paystack_response["data"]
            
            return {
                "payment_id": payment["id"],
                "authorization_url": data["authorization_url"],
                "access_code": data["access_code"],
                "reference": reference,
            }
            
        except requests.exceptions.RequestException as e:
            # If Paystack API fails, still return payment record but with error
            # In development with placeholder keys, this will fail
            if settings.is_development and not settings.PAYSTACK_SECRET_KEY:
                # Return mock response for development
                return {
                    "payment_id": payment["id"],
                    "authorization_url": f"https://checkout.paystack.com/{reference}",
                    "access_code": "mock_access_code",
                    "reference": reference,
                }
            raise ValueError(f"Paystack API error: {str(e)}")
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> bool:
        """
        Verify Paystack webhook signature using HMAC SHA512
        
        Args:
            payload: Raw request body bytes
            signature: X-Paystack-Signature header value
            
        Returns:
            True if signature is valid, False otherwise
        """
        if not settings.PAYSTACK_WEBHOOK_SECRET:
            # In development with no secret, log warning and allow
            print("WARNING: No webhook secret configured, skipping verification")
            return True
        
        computed_signature = hmac.new(
            settings.PAYSTACK_WEBHOOK_SECRET.encode("utf-8"),
            payload,
            hashlib.sha512,
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)
    
    @staticmethod
    def verify_payment_with_paystack(reference: str) -> Dict[str, Any]:
        """
        Verify payment status with Paystack API
        
        Args:
            reference: Payment reference
            
        Returns:
            Payment verification data from Paystack
        """
        try:
            response = requests.get(
                f"{PaymentService.PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                headers={
                    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                },
                timeout=30,
            )
            
            response.raise_for_status()
            result = response.json()
            
            if not result.get("status"):
                raise ValueError(result.get("message", "Verification failed"))
            
            return result["data"]
            
        except requests.exceptions.RequestException as e:
            # In development, return mock success
            if settings.is_development and not settings.PAYSTACK_SECRET_KEY:
                return {
                    "status": "success",
                    "reference": reference,
                    "amount": 0,
                    "paid_at": datetime.utcnow().isoformat(),
                }
            raise ValueError(f"Paystack verification error: {str(e)}")
    
    @staticmethod
    def handle_webhook(event: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle Paystack webhook events
        
        Args:
            event: Event type (e.g., "charge.success")
            data: Event data
            
        Returns:
            Processing result
        """
        if event == "charge.success":
            reference = data.get("reference")
            
            if not reference:
                return {"success": False, "message": "No reference in webhook"}
            
            # Find payment by reference
            payment_result = (
                supabase_admin.table("payments")
                .select("*")
                .eq("provider_reference", reference)
                .single()
                .execute()
            )
            
            if not payment_result.data:
                return {"success": False, "message": "Payment not found"}
            
            payment = payment_result.data
            
            # Skip if already processed
            if payment["status"] in ["successful", "refunded"]:
                return {"success": True, "message": "Already processed"}
            
            # Verify with Paystack API (don't trust webhook alone)
            try:
                verification = PaymentService.verify_payment_with_paystack(reference)
                
                if verification.get("status") == "success":
                    # Update payment status
                    update_data = {
                        "status": "successful",
                        "verified_at": datetime.utcnow().isoformat(),
                        "paid_at": data.get("paid_at") or datetime.utcnow().isoformat(),
                        "metadata": {
                            **payment.get("metadata", {}),
                            "paystack_data": {
                                "amount": data.get("amount"),
                                "channel": data.get("channel"),
                                "currency": data.get("currency"),
                                "ip_address": data.get("ip_address"),
                                "fees": data.get("fees"),
                            },
                        },
                    }
                    
                    supabase_admin.table("payments").update(update_data).eq(
                        "id", payment["id"]
                    ).execute()
                    
                    return {"success": True, "message": "Payment verified and updated"}
                else:
                    # Payment failed verification
                    supabase_admin.table("payments").update(
                        {"status": "failed"}
                    ).eq("id", payment["id"]).execute()
                    
                    return {"success": False, "message": "Payment verification failed"}
                    
            except Exception as e:
                print(f"Webhook verification error: {e}")
                return {"success": False, "message": str(e)}
        
        return {"success": True, "message": f"Event {event} acknowledged"}
    
    @staticmethod
    def get_student_payments(student_id: str) -> List[Dict[str, Any]]:
        """Get all payments for a student"""
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
            .eq("student_id", student_id)
            .order("created_at", desc=True)
            .execute()
        )
        
        payments = []
        for payment in result.data or []:
            payment["programme_title"] = (
                payment["enrollments"]["programmes"]["title"]
                if payment.get("enrollments")
                and payment["enrollments"].get("programmes")
                else None
            )
            payments.append(payment)
        
        return payments
    
    @staticmethod
    def get_all_payments(
        status: Optional[str] = None,
        student_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get all payments (admin only)"""
        query = supabase_admin.table("payments").select(
            """
            *,
            profiles!inner(first_name, last_name),
            enrollments!inner(
                programmes!inner(title)
            )
        """
        )
        
        if status:
            query = query.eq("status", status)
        
        if student_id:
            query = query.eq("student_id", student_id)
        
        result = query.order("created_at", desc=True).limit(limit).execute()
        
        payments = []
        for payment in result.data or []:
            payment["student_name"] = (
                f"{payment['profiles']['first_name']} {payment['profiles']['last_name']}"
                if payment.get("profiles")
                else None
            )
            payment["programme_title"] = (
                payment["enrollments"]["programmes"]["title"]
                if payment.get("enrollments")
                and payment["enrollments"].get("programmes")
                else None
            )
            payments.append(payment)
        
        return payments
    
    @staticmethod
    def update_payment_status(
        payment_id: str, status: str, reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update payment status (admin only)"""
        update_data = {"status": status}
        
        if status in ["successful", "refunded"]:
            update_data["verified_at"] = datetime.utcnow().isoformat()
        
        if reason:
            current_metadata = (
                supabase_admin.table("payments")
                .select("metadata")
                .eq("id", payment_id)
                .single()
                .execute()
                .data.get("metadata", {})
            )
            update_data["metadata"] = {**current_metadata, "admin_reason": reason}
        
        result = (
            supabase_admin.table("payments")
            .update(update_data)
            .eq("id", payment_id)
            .execute()
        )
        
        if not result.data:
            raise ValueError("Payment not found")
        
        return result.data[0]
