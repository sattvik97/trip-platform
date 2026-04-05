from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.crud.organizer import (
    organizer_can_submit_verification,
    organizer_verification_checklist,
)
from app.crud.trip import get_trip_publish_blockers
from app.models.booking import Booking, BookingStatus
from app.models.organizer import Organizer
from app.models.organizer_ledger_entry import (
    OrganizerLedgerEntry,
    OrganizerLedgerEntryStatus,
    OrganizerLedgerEntryType,
)
from app.models.organizer_payout import OrganizerPayout, OrganizerPayoutStatus
from app.models.payment import Payment, PaymentStatus
from app.models.trip import Trip, TripStatus
from app.schemas.organizer_ops import (
    OrganizerFinanceOverviewResponse,
    OrganizerFinanceSummaryResponse,
    OrganizerOverviewBooking,
    OrganizerOverviewTripAlert,
    OrganizerOverviewUpcomingTrip,
)

MONEY_PLACES = Decimal("0.01")


def _money(value: Decimal | float | int | None) -> Decimal:
    numeric = value if isinstance(value, Decimal) else Decimal(str(value or 0))
    return numeric.quantize(MONEY_PLACES, rounding=ROUND_HALF_UP)


def _payout_setup_complete(organizer: Organizer) -> bool:
    return bool(
        organizer.payout_method and organizer.payout_beneficiary and organizer.payout_reference
    )


def _platform_fee_amount(amount: Decimal) -> Decimal:
    fee = amount * Decimal(str(settings.ORGANIZER_PLATFORM_FEE_PERCENT / 100))
    return _money(fee)


def _status_for_available_on(available_on: datetime | None, now: datetime) -> OrganizerLedgerEntryStatus:
    if available_on and available_on > now:
        return OrganizerLedgerEntryStatus.PENDING
    return OrganizerLedgerEntryStatus.AVAILABLE


def _create_entry_if_missing(
    db: Session,
    *,
    organizer_id: str,
    booking_id: str,
    payment_id: int,
    entry_type: OrganizerLedgerEntryType,
    amount: Decimal,
    currency: str,
    description: str,
    occurred_at: datetime,
    available_on: datetime | None,
) -> None:
    existing = (
        db.query(OrganizerLedgerEntry)
        .filter(
            OrganizerLedgerEntry.payment_id == payment_id,
            OrganizerLedgerEntry.entry_type == entry_type,
        )
        .first()
    )
    if existing:
        return

    now = datetime.now(timezone.utc)
    db.add(
        OrganizerLedgerEntry(
            organizer_id=organizer_id,
            booking_id=booking_id,
            payment_id=payment_id,
            entry_type=entry_type,
            status=_status_for_available_on(available_on, now),
            amount=_money(amount),
            currency=currency,
            description=description,
            occurred_at=occurred_at,
            available_on=available_on,
        )
    )


def sync_payment_to_ledger(db: Session, payment: Payment) -> None:
    booking = payment.booking
    trip = booking.trip if booking else None
    if not booking or not trip:
        return

    organizer_id = trip.organizer_id
    occurred_at = payment.updated_at or payment.created_at or datetime.now(timezone.utc)
    available_on = occurred_at + timedelta(days=settings.ORGANIZER_PAYOUT_DELAY_DAYS)
    gross_amount = _money(payment.amount)
    fee_amount = _platform_fee_amount(gross_amount)

    if payment.status in (PaymentStatus.SUCCESS, PaymentStatus.REFUNDED):
        _create_entry_if_missing(
            db,
            organizer_id=organizer_id,
            booking_id=booking.id,
            payment_id=payment.id,
            entry_type=OrganizerLedgerEntryType.BOOKING_GROSS,
            amount=gross_amount,
            currency=payment.currency,
            description=f"Traveler payment captured for booking {booking.id}",
            occurred_at=occurred_at,
            available_on=available_on,
        )
        _create_entry_if_missing(
            db,
            organizer_id=organizer_id,
            booking_id=booking.id,
            payment_id=payment.id,
            entry_type=OrganizerLedgerEntryType.PLATFORM_FEE,
            amount=-fee_amount,
            currency=payment.currency,
            description=f"Platform fee withheld for booking {booking.id}",
            occurred_at=occurred_at,
            available_on=available_on,
        )

    if payment.status == PaymentStatus.REFUNDED:
        _create_entry_if_missing(
            db,
            organizer_id=organizer_id,
            booking_id=booking.id,
            payment_id=payment.id,
            entry_type=OrganizerLedgerEntryType.REFUND,
            amount=-gross_amount,
            currency=payment.currency,
            description=f"Refund recorded for booking {booking.id}",
            occurred_at=occurred_at,
            available_on=occurred_at,
        )


def refresh_organizer_finance(db: Session, organizer_id: str) -> None:
    payments = (
        db.query(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Trip, Booking.trip_id == Trip.id)
        .options(joinedload(Payment.booking).joinedload(Booking.trip))
        .filter(
            Trip.organizer_id == organizer_id,
            Payment.status.in_([PaymentStatus.SUCCESS, PaymentStatus.REFUNDED]),
        )
        .all()
    )

    for payment in payments:
        sync_payment_to_ledger(db, payment)

    now = datetime.now(timezone.utc)
    stale_pending_entries = (
        db.query(OrganizerLedgerEntry)
        .filter(
            OrganizerLedgerEntry.organizer_id == organizer_id,
            OrganizerLedgerEntry.status == OrganizerLedgerEntryStatus.PENDING,
            OrganizerLedgerEntry.available_on.isnot(None),
            OrganizerLedgerEntry.available_on <= now,
        )
        .all()
    )
    for entry in stale_pending_entries:
        entry.status = OrganizerLedgerEntryStatus.AVAILABLE

    db.commit()


def _entry_amount(value: OrganizerLedgerEntry | Decimal) -> Decimal:
    if isinstance(value, OrganizerLedgerEntry):
        return _money(value.amount)
    return _money(value)


def _sum_amounts(entries: Iterable[OrganizerLedgerEntry | Decimal]) -> Decimal:
    total = Decimal("0")
    for entry in entries:
        total += _entry_amount(entry)
    return _money(total)


def build_finance_summary(db: Session, organizer: Organizer) -> OrganizerFinanceSummaryResponse:
    refresh_organizer_finance(db, organizer.id)

    entries = (
        db.query(OrganizerLedgerEntry)
        .filter(OrganizerLedgerEntry.organizer_id == organizer.id)
        .order_by(OrganizerLedgerEntry.occurred_at.desc())
        .all()
    )
    scheduled_payout = (
        db.query(OrganizerPayout)
        .filter(
            OrganizerPayout.organizer_id == organizer.id,
            OrganizerPayout.status.in_(
                [OrganizerPayoutStatus.SCHEDULED, OrganizerPayoutStatus.PROCESSING]
            ),
        )
        .order_by(OrganizerPayout.scheduled_for.asc())
        .first()
    )

    gross_bookings = _sum_amounts(
        entry for entry in entries if entry.entry_type == OrganizerLedgerEntryType.BOOKING_GROSS
    )
    platform_fees = _sum_amounts(
        -entry.amount
        for entry in entries
        if entry.entry_type == OrganizerLedgerEntryType.PLATFORM_FEE
    )
    refunds = _sum_amounts(
        -entry.amount for entry in entries if entry.entry_type == OrganizerLedgerEntryType.REFUND
    )
    pending_balance = _sum_amounts(
        entry for entry in entries if entry.status == OrganizerLedgerEntryStatus.PENDING
    )
    available_entries = [
        entry for entry in entries if entry.status == OrganizerLedgerEntryStatus.AVAILABLE
    ]
    available_balance = _sum_amounts(available_entries)
    paid_out_total = _sum_amounts(
        entry for entry in entries if entry.status == OrganizerLedgerEntryStatus.PAID_OUT
    )
    next_pending_date = min(
        (entry.available_on for entry in entries if entry.status == OrganizerLedgerEntryStatus.PENDING and entry.available_on),
        default=None,
    )

    return OrganizerFinanceSummaryResponse(
        gross_bookings=gross_bookings,
        platform_fees=platform_fees,
        refunds=refunds,
        pending_balance=pending_balance,
        available_balance=available_balance,
        paid_out_total=paid_out_total,
        net_earnings=_money(gross_bookings - platform_fees - refunds),
        next_payout_amount=_money(scheduled_payout.amount if scheduled_payout else available_balance),
        next_payout_date=scheduled_payout.scheduled_for if scheduled_payout else next_pending_date,
        payout_setup_complete=_payout_setup_complete(organizer),
        payout_method=organizer.payout_method,
        payout_reference=organizer.payout_reference,
    )


def request_payout(
    db: Session,
    *,
    organizer: Organizer,
    note: str | None = None,
) -> OrganizerPayout:
    refresh_organizer_finance(db, organizer.id)

    if not _payout_setup_complete(organizer):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add payout method, beneficiary, and payout reference before requesting a payout",
        )

    existing = (
        db.query(OrganizerPayout)
        .filter(
            OrganizerPayout.organizer_id == organizer.id,
            OrganizerPayout.status.in_(
                [OrganizerPayoutStatus.SCHEDULED, OrganizerPayoutStatus.PROCESSING]
            ),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A payout is already scheduled for this organizer",
        )

    entries = (
        db.query(OrganizerLedgerEntry)
        .filter(
            OrganizerLedgerEntry.organizer_id == organizer.id,
            OrganizerLedgerEntry.status == OrganizerLedgerEntryStatus.AVAILABLE,
            OrganizerLedgerEntry.payout_id.is_(None),
        )
        .order_by(OrganizerLedgerEntry.occurred_at.asc())
        .all()
    )
    if not entries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There is no available payout balance yet",
        )

    amount = _sum_amounts(entries)
    if amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Available balance is not positive enough to create a payout",
        )

    payout = OrganizerPayout(
        organizer_id=organizer.id,
        amount=amount,
        currency=entries[0].currency or "INR",
        status=OrganizerPayoutStatus.SCHEDULED,
        scheduled_for=datetime.now(timezone.utc) + timedelta(days=2),
        notes=note,
    )
    db.add(payout)
    db.flush()
    payout.reference = f"PAYOUT-{payout.id}"

    for entry in entries:
        entry.status = OrganizerLedgerEntryStatus.PAID_OUT
        entry.payout_id = payout.id

    db.commit()
    db.refresh(payout)
    return payout


def build_organizer_overview(db: Session, organizer: Organizer) -> OrganizerFinanceOverviewResponse:
    summary = build_finance_summary(db, organizer)

    active_trips = (
        db.query(Trip)
        .filter(
            Trip.organizer_id == organizer.id,
            Trip.status == TripStatus.PUBLISHED,
        )
        .count()
    )
    draft_trips = (
        db.query(Trip)
        .filter(
            Trip.organizer_id == organizer.id,
            Trip.status == TripStatus.DRAFT,
        )
        .count()
    )

    review_queue_count = (
        db.query(Booking)
        .join(Trip, Booking.trip_id == Trip.id)
        .filter(
            Trip.organizer_id == organizer.id,
            Booking.status == BookingStatus.REVIEW_PENDING,
        )
        .count()
    )
    review_queue = (
        db.query(Booking)
        .join(Trip, Booking.trip_id == Trip.id)
        .filter(
            Trip.organizer_id == organizer.id,
            Booking.status == BookingStatus.REVIEW_PENDING,
        )
        .order_by(Booking.created_at.asc())
        .limit(5)
        .all()
    )
    payment_pending_count = (
        db.query(Booking)
        .join(Trip, Booking.trip_id == Trip.id)
        .filter(
            Trip.organizer_id == organizer.id,
            Booking.status == BookingStatus.PAYMENT_PENDING,
        )
        .count()
    )
    confirmed_bookings = (
        db.query(Booking)
        .join(Trip, Booking.trip_id == Trip.id)
        .filter(
            Trip.organizer_id == organizer.id,
            Booking.status == BookingStatus.CONFIRMED,
        )
        .all()
    )
    confirmed_travelers = sum(
        int(booking.num_travelers or booking.seats_booked or 0) for booking in confirmed_bookings
    )

    draft_trip_rows = (
        db.query(Trip)
        .filter(
            Trip.organizer_id == organizer.id,
            Trip.status == TripStatus.DRAFT,
        )
        .order_by(Trip.start_date.asc())
        .limit(5)
        .all()
    )
    draft_trip_alerts = []
    for trip in draft_trip_rows:
        blockers = get_trip_publish_blockers(db, trip)
        if blockers:
            draft_trip_alerts.append(
                OrganizerOverviewTripAlert(
                    id=trip.id,
                    title=trip.title,
                    start_date=trip.start_date,
                    publish_blockers=blockers[:4],
                )
            )

    upcoming_trip_rows = (
        db.query(Trip)
        .filter(
            Trip.organizer_id == organizer.id,
            Trip.status == TripStatus.PUBLISHED,
            Trip.start_date >= date.today(),
        )
        .order_by(Trip.start_date.asc())
        .limit(5)
        .all()
    )
    upcoming_trips = []
    for trip in upcoming_trip_rows:
        confirmed_seats = (
            db.query(Booking)
            .filter(
                Booking.trip_id == trip.id,
                Booking.status.in_([BookingStatus.PAYMENT_PENDING, BookingStatus.CONFIRMED]),
            )
            .all()
        )
        booked_seats = sum(int(booking.seats_booked or 0) for booking in confirmed_seats)
        upcoming_trips.append(
            OrganizerOverviewUpcomingTrip(
                id=trip.id,
                title=trip.title,
                start_date=trip.start_date,
                destination=trip.destination,
                booked_seats=booked_seats,
                total_seats=int(trip.total_seats or 0),
                available_seats=max(int(trip.total_seats or 0) - booked_seats, 0),
            )
        )

    urgent_bookings = [
        OrganizerOverviewBooking(
            id=booking.id,
            trip_id=booking.trip_id,
            trip_title=booking.trip.title if booking.trip else "Trip",
            traveler_name=booking.contact_name or booking.contact_email or "Traveler",
            travelers=int(booking.num_travelers or booking.seats_booked or 0),
            created_at=booking.created_at,
            status=booking.status.value,
        )
        for booking in review_queue
    ]

    return OrganizerFinanceOverviewResponse(
        active_trips=active_trips,
        draft_trips=draft_trips,
        review_queue_count=review_queue_count,
        payment_pending_count=payment_pending_count,
        confirmed_travelers=confirmed_travelers,
        gross_bookings=summary.gross_bookings,
        pending_balance=summary.pending_balance,
        available_balance=summary.available_balance,
        next_payout_amount=summary.next_payout_amount,
        next_payout_date=summary.next_payout_date,
        verification_status=organizer.verification_status,
        can_submit_verification=organizer_can_submit_verification(organizer),
        verification_checklist=organizer_verification_checklist(organizer),
        urgent_bookings=urgent_bookings,
        draft_trip_alerts=draft_trip_alerts,
        upcoming_trips=upcoming_trips,
    )
