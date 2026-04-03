import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request, status
from sqlalchemy.orm import Session, joinedload

from app.core.auth import PaymentListActor, get_current_end_user, get_payment_list_actor
from app.db.deps import get_db
from app.models.booking import Booking
from app.models.end_user import EndUser
from app.models.payment import Payment, PaymentStatus
from app.models.payment_event import PaymentEvent
from app.models.trip import Trip
from app.payments.deps import get_payment_provider
from app.payments.providers import PaymentProvider
from app.schemas.payment import (
    PaymentCreateRequest,
    PaymentCreateResponse,
    PaymentEventResponse,
    PaymentOrderInfo,
    PaymentResponse,
    PaymentVerifyRequest,
    WebhookAckResponse,
)
from app.services.payment_service import PaymentService

router = APIRouter()


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    actor: PaymentListActor = Depends(get_payment_list_actor),
    booking_id: Optional[str] = Query(None),
    booking_ids: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=200),
):
    """
    List payment attempts visible to the caller (end user: own bookings; organizer: trips they own).
    Returns a plain array for the booking/account UIs.
    """
    q = db.query(Payment).join(Booking, Payment.booking_id == Booking.id)
    if actor.end_user:
        q = q.filter(Booking.user_id == actor.end_user.id)
    else:
        org = actor.organizer
        if not org or not org.organizer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organizer ID not found",
            )
        q = q.join(Trip, Booking.trip_id == Trip.id).filter(Trip.organizer_id == org.organizer_id)

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

    rows = q.order_by(Payment.created_at.desc()).limit(limit).all()
    return [PaymentResponse.model_validate(p) for p in rows]


@router.get("/{payment_id}/events", response_model=List[PaymentEventResponse])
def list_payment_events(
    payment_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    actor: PaymentListActor = Depends(get_payment_list_actor),
):
    payment = (
        db.query(Payment)
        .options(joinedload(Payment.booking).joinedload(Booking.trip))
        .filter(Payment.id == payment_id)
        .first()
    )
    if not payment or not payment.booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    booking = payment.booking
    if actor.end_user:
        if booking.user_id != actor.end_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    else:
        org = actor.organizer
        if not org or not org.organizer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organizer ID not found")
        trip = booking.trip
        if not trip or trip.organizer_id != org.organizer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    events = (
        db.query(PaymentEvent)
        .filter(PaymentEvent.payment_id == payment_id)
        .order_by(PaymentEvent.created_at.asc())
        .all()
    )
    return [PaymentEventResponse.model_validate(e) for e in events]


@router.post("", response_model=PaymentCreateResponse)
def create_payment(
    payload: PaymentCreateRequest,
    db: Session = Depends(get_db),
    current_user: EndUser = Depends(get_current_end_user),
    provider: PaymentProvider = Depends(get_payment_provider),
):
    service = PaymentService(db, provider)
    payment, order = service.create_payment(
        booking_id=payload.booking_id,
        user_id=current_user.id,
    )
    return PaymentCreateResponse(
        payment=PaymentResponse.model_validate(payment),
        order=PaymentOrderInfo(
            order_id=str(order["order_id"]),
            amount=payment.amount,
            currency=payment.currency,
            provider=payment.provider,
        ),
    )


@router.post("/verify", response_model=PaymentResponse)
def verify_payment(
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: EndUser = Depends(get_current_end_user),
    provider: PaymentProvider = Depends(get_payment_provider),
):
    service = PaymentService(db, provider)
    verify_payload = dict(payload.payload or {})
    verify_payload.setdefault("provider_payment_id", payload.provider_payment_id)
    verify_payload.setdefault("provider_signature", payload.provider_signature)

    payment = service.verify_payment(
        payment_id=payload.payment_id,
        payload=verify_payload,
        user_id=current_user.id,
    )
    return PaymentResponse.model_validate(payment)


@router.post("/webhook", response_model=WebhookAckResponse)
async def webhook(
    request: Request,
    db: Session = Depends(get_db),
    provider: PaymentProvider = Depends(get_payment_provider),
):
    raw_body = await request.body()
    try:
        payload = json.loads(raw_body.decode("utf-8") or "{}")
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook JSON payload",
        ) from exc

    headers = dict(request.headers)

    service = PaymentService(db, provider)
    result = service.process_webhook(
        payload=payload,
        headers=headers,
        raw_body=raw_body.decode("utf-8"),
    )
    return WebhookAckResponse(**result)
