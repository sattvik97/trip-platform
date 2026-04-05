from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, conint
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.auth import get_current_end_user, require_organizer
from app.db.deps import get_db
from app.models.booking import Booking, BookingStatus
from app.models.end_user import EndUser
from app.models.trip import Trip
from app.payments.deps import get_payment_provider
from app.payments.providers import PaymentProvider
from app.schemas.booking import (
    BookingCheckoutResponse,
    BookingCreateRequest,
    BookingWithPaymentOrderResponse,
)
from app.schemas.payment import PaymentOrderInfo, PaymentResponse
from app.services.booking_service import BookingService
from app.services.payment_service import PaymentService

router = APIRouter()


@router.post(
    "",
    response_model=BookingWithPaymentOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    payload: BookingCreateRequest,
    db: Session = Depends(get_db),
    current_user: EndUser = Depends(get_current_end_user),
    provider: PaymentProvider = Depends(get_payment_provider),
):
    booking_service = BookingService(db)
    payment_service = PaymentService(db, provider)

    booking = booking_service.create_booking(
        trip_id=payload.trip_id,
        user_id=current_user.id,
        seats=payload.seats,
    )
    try:
        payment, order = payment_service.create_payment(
            booking_id=booking.id,
            user_id=current_user.id,
        )
    except HTTPException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={
                "message": exc.detail,
                "booking_id": booking.id,
            },
        ) from exc

    return BookingWithPaymentOrderResponse(
        booking=BookingCheckoutResponse(
            id=booking.id,
            trip_id=booking.trip_id,
            user_id=booking.user_id,
            seats=booking.seats_booked,
            amount_snapshot=booking.amount_snapshot,
            currency=booking.currency,
            status=booking.status,
            expires_at=booking.expires_at,
            created_at=booking.created_at,
        ),
        payment=PaymentResponse.model_validate(payment),
        payment_order=PaymentOrderInfo(
            order_id=str(order["order_id"]),
            amount=payment.amount,
            currency=payment.currency,
            provider=payment.provider,
        ),
    )


class OfflineBookingRequest(BaseModel):
    seats: conint(gt=0)
    contact_name: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    organizer_note: str | None = None


@router.post("/trips/{trip_id}/offline-booking")
def add_offline_booking(
    trip_id: str,
    payload: OfflineBookingRequest,
    db: Session = Depends(get_db),
    organizer_id: str = Depends(require_organizer),
):
    now = datetime.now(timezone.utc)

    trip = db.query(Trip).filter(Trip.id == trip_id).with_for_update().first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.organizer_id != organizer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    db.query(Booking).filter(
        Booking.trip_id == trip_id,
        Booking.status == BookingStatus.PAYMENT_PENDING,
        Booking.expires_at.is_not(None),
        Booking.expires_at < now,
    ).update(
        {Booking.status: BookingStatus.EXPIRED},
        synchronize_session=False,
    )

    booked = (
        db.query(func.coalesce(func.sum(Booking.seats_booked), 0))
        .filter(
            Booking.trip_id == trip_id,
            Booking.status.in_([BookingStatus.PAYMENT_PENDING, BookingStatus.CONFIRMED]),
        )
        .scalar()
    )
    available = trip.total_seats - int(booked or 0)
    if payload.seats > available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough seats")

    booking = Booking(
        trip_id=trip_id,
        seats_booked=payload.seats,
        source="offline",
        status=BookingStatus.CONFIRMED,
        amount_snapshot=trip.price * payload.seats,
        currency="INR",
        expires_at=None,
        num_travelers=payload.seats,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        price_per_person=trip.price,
        total_price=trip.price * payload.seats,
        organizer_note=payload.organizer_note,
        decision_reason="Offline booking recorded by organizer",
        decision_at=now,
    )
    db.add(booking)
    db.commit()

    return {"message": "Offline booking added"}
