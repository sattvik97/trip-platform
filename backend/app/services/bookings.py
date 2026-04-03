"""
Backward-compatible wrappers around BookingService and PaymentService.
"""

from typing import Any, Dict

from sqlalchemy.orm import Session

from app.payments.providers import PaymentProvider
from app.services.booking_service import BookingService
from app.services.payment_service import PaymentService


def create_booking_with_payment_order(
    db: Session,
    *,
    trip_id: str,
    user_id: str,
    seats: int,
    provider: PaymentProvider,
) -> Dict[str, Any]:
    booking_service = BookingService(db)
    payment_service = PaymentService(db, provider)
    booking = booking_service.create_booking(trip_id=trip_id, user_id=user_id, seats=seats)
    payment, order = payment_service.create_payment(booking_id=booking.id, user_id=user_id)
    return {
        "booking": booking,
        "payment": payment,
        "payment_order": {
            "order_id": order["order_id"],
            "amount": payment.amount,
            "currency": payment.currency,
            "provider": payment.provider,
        },
    }


def verify_booking_payment(
    db: Session,
    *,
    payment_id: int,
    payload: Dict[str, Any],
    provider: PaymentProvider,
    user_id: str,
):
    service = PaymentService(db, provider)
    return service.verify_payment(
        payment_id=payment_id,
        payload=payload,
        user_id=user_id,
    )


def expire_stale_bookings(db: Session) -> int:
    return BookingService(db).expire_stale_bookings()
