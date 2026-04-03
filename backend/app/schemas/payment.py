from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.payment import PaymentStatus


class PaymentResponse(BaseModel):
    id: int
    booking_id: str
    provider: str
    provider_order_id: str
    provider_payment_id: Optional[str] = None
    amount: Decimal
    currency: str
    status: PaymentStatus
    provider_signature: Optional[str] = None
    raw_provider_response: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentOrderInfo(BaseModel):
    order_id: str
    amount: Decimal
    currency: str
    provider: str


class PaymentCreateRequest(BaseModel):
    booking_id: str


class PaymentCreateResponse(BaseModel):
    payment: PaymentResponse
    order: PaymentOrderInfo


class PaymentVerifyRequest(BaseModel):
    payment_id: int
    provider_payment_id: Optional[str] = None
    provider_signature: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)


class WebhookAckResponse(BaseModel):
    processed: bool
    payment_id: Optional[int] = None
    status: Optional[str] = None
    reason: Optional[str] = None


class PaymentEventResponse(BaseModel):
    id: int
    payment_id: int
    event_type: str
    raw_payload: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedPaymentsResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    page: int
    page_size: int


class RefundRequest(BaseModel):
    reason: Optional[str] = None


class RefundResponse(BaseModel):
    accepted: bool
    message: str
    payment: Optional[PaymentResponse] = None
