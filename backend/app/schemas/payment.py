from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentCreate(BaseModel):
    enrollment_id: str
    amount_minor: int = Field(..., gt=0, description="Amount in minor units (e.g., kobo for NGN)")
    currency: str = Field(default="NGN", description="Currency code")
    callback_url: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "enrollment_id": "123e4567-e89b-12d3-a456-426614174000",
                "amount_minor": 50000,
                "currency": "NGN",
                "callback_url": "https://yourapp.com/payment/callback"
            }
        }


class PaymentInitializeResponse(BaseModel):
    payment_id: str
    authorization_url: str
    access_code: str
    reference: str


class PaymentResponse(BaseModel):
    id: str
    enrollment_id: str
    student_id: str
    amount_minor: int
    currency: str
    provider: str
    provider_reference: str
    status: PaymentStatus
    verified_at: Optional[datetime]
    paid_at: Optional[datetime]
    metadata: Dict[str, Any] = {}
    created_at: datetime
    
    # Joined data
    student_name: Optional[str] = None
    programme_title: Optional[str] = None
    
    class Config:
        from_attributes = True


class PaymentWebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]


class PaymentVerifyResponse(BaseModel):
    verified: bool
    status: PaymentStatus
    message: str
    amount_minor: Optional[int] = None
    paid_at: Optional[datetime] = None


class PaymentStatusUpdate(BaseModel):
    status: PaymentStatus
    reason: Optional[str] = None
