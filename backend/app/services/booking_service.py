from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.models.trip import Trip, TripStatus


class BookingService:
    HOLD_MINUTES = 10

    def __init__(self, db: Session):
        self.db = db

    def create_booking(self, *, trip_id: str, user_id: str, seats: int) -> Booking:
        if seats <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seats must be greater than zero",
            )

        now = datetime.now(timezone.utc)

        try:
            trip = (
                self.db.query(Trip)
                .filter(Trip.id == trip_id)
                .with_for_update()
                .first()
            )
            if not trip:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
            if not trip.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Trip is not active",
                )
            if trip.status != TripStatus.PUBLISHED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Trip is not open for bookings",
                )

            self._expire_stale_for_trip(trip_id=trip.id, now=now)

            held_seats = (
                self.db.query(func.coalesce(func.sum(Booking.seats_booked), 0))
                .filter(
                    Booking.trip_id == trip.id,
                    Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
                )
                .scalar()
            )
            held_seats = int(held_seats or 0)
            if held_seats + seats > trip.total_seats:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Not enough seats available",
                )

            amount_snapshot = Decimal(trip.price) * Decimal(seats)
            booking = Booking(
                trip_id=trip.id,
                user_id=user_id,
                seats_booked=seats,
                source="user",
                amount_snapshot=amount_snapshot,
                currency="INR",
                status=BookingStatus.PENDING,
                expires_at=now + timedelta(minutes=self.HOLD_MINUTES),
            )
            self.db.add(booking)
            self.db.commit()
            self.db.refresh(booking)
            return booking
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create booking",
            ) from exc

    def expire_stale_bookings(self) -> int:
        now = datetime.now(timezone.utc)
        try:
            updated_count = (
                self.db.query(Booking)
                .filter(
                    Booking.status == BookingStatus.PENDING,
                    Booking.expires_at < now,
                )
                .update({Booking.status: BookingStatus.EXPIRED}, synchronize_session=False)
            )
            self.db.commit()
            return int(updated_count or 0)
        except Exception:
            self.db.rollback()
            raise

    def _expire_stale_for_trip(self, *, trip_id: str, now: datetime) -> None:
        self.db.query(Booking).filter(
            Booking.trip_id == trip_id,
            Booking.status == BookingStatus.PENDING,
            Booking.expires_at < now,
        ).update(
            {Booking.status: BookingStatus.EXPIRED},
            synchronize_session=False,
        )
