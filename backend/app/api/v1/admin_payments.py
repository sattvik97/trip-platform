from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.auth import require_organizer
from app.db.deps import get_db
from app.models.booking import Booking
from app.models.payment import Payment, PaymentStatus
from app.models.payment_event import PaymentEvent
from app.models.trip import Trip
from app.payments.deps import get_payment_provider
from app.payments.providers import PaymentProvider
from app.schemas.payment import (
    PaginatedPaymentsResponse,
    PaymentEventResponse,
    PaymentResponse,
    RefundRequest,
    RefundResponse,
)
from app.services.payment_service import PaymentService

router = APIRouter()


@router.get("", response_model=PaginatedPaymentsResponse)
def admin_list_payments(
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
    booking_id: Optional[str] = Query(None),
    booking_ids: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Trip, Booking.trip_id == Trip.id)
        .filter(Trip.organizer_id == organizer_id)
    )

    if booking_id:
        q = q.filter(Payment.booking_id == booking_id)
    if booking_ids:
        ids = [x.strip() for x in booking_ids.split(",") if x.strip()]
        if ids:
            q = q.filter(Payment.booking_id.in_(ids))
    if payment_status:
        try:
            q = q.filter(Payment.status == PaymentStatus(payment_status))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment_status",
            ) from exc

    total = q.count()
    rows = (
        q.order_by(Payment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedPaymentsResponse(
        items=[PaymentResponse.model_validate(p) for p in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{payment_id}/events", response_model=List[PaymentEventResponse])
def admin_payment_events(
    payment_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    payment = (
        db.query(Payment)
        .options(joinedload(Payment.booking).joinedload(Booking.trip))
        .filter(Payment.id == payment_id)
        .first()
    )
    if not payment or not payment.booking or not payment.booking.trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.booking.trip.organizer_id != organizer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    events = (
        db.query(PaymentEvent)
        .filter(PaymentEvent.payment_id == payment_id)
        .order_by(PaymentEvent.created_at.asc())
        .all()
    )
    return [PaymentEventResponse.model_validate(e) for e in events]


@router.post("/{payment_id}/refund", response_model=RefundResponse)
def admin_refund_payment(
    payload: RefundRequest,
    payment_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
    provider: PaymentProvider = Depends(get_payment_provider),
):
    service = PaymentService(db, provider)
    payment = service.request_refund(
        payment_id=payment_id,
        organizer_id=organizer_id,
        reason=payload.reason,
    )
    return RefundResponse(
        accepted=True,
        message="Refund recorded",
        payment=PaymentResponse.model_validate(payment),
    )
