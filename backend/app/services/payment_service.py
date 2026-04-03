import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Mapping, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.models.payment_event import PaymentEvent
from app.payments.providers import ParsedWebhook, PaymentProvider

logger = logging.getLogger(__name__)


def _json_safe_for_storage(value: Any) -> Any:
    """Ensure values stored in JSON columns are JSON-serializable (e.g. Decimal from ORM)."""
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, dict):
        return {k: _json_safe_for_storage(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe_for_storage(v) for v in value]
    return value


class PaymentService:
    def __init__(self, db: Session, provider: PaymentProvider):
        self.db = db
        self.provider = provider

    def create_payment(self, *, booking_id: str, user_id: Optional[str] = None) -> Tuple[Payment, Dict[str, Any]]:
        now = datetime.now(timezone.utc)

        try:
            booking = (
                self.db.query(Booking)
                .filter(Booking.id == booking_id)
                .with_for_update()
                .first()
            )
            if not booking:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
            if user_id and booking.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to pay for this booking",
                )
            if booking.status == BookingStatus.CONFIRMED:
                latest_success = (
                    self.db.query(Payment)
                    .filter(
                        Payment.booking_id == booking.id,
                        Payment.status == PaymentStatus.SUCCESS,
                    )
                    .order_by(Payment.created_at.desc())
                    .first()
                )
                if latest_success:
                    return latest_success, {"order_id": latest_success.provider_order_id}
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Booking is already confirmed",
                )
            if booking.status != BookingStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot create payment for booking in {booking.status} state",
                )
            if booking.expires_at < now:
                booking.status = BookingStatus.EXPIRED
                self.db.commit()
                self.db.refresh(booking)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Booking has expired",
                )

            order = self.provider.create_order(
                booking_id=booking.id,
                amount=booking.amount_snapshot,
                currency=booking.currency,
                metadata={"booking_id": booking.id, "user_id": booking.user_id},
            )
            order = _json_safe_for_storage(order)
            provider_order_id = str(order.get("order_id", "")).strip()
            if not provider_order_id:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Payment provider did not return an order ID",
                )

            payment = Payment(
                booking_id=booking.id,
                provider=self.provider.name,
                provider_order_id=provider_order_id,
                amount=booking.amount_snapshot,
                currency=booking.currency,
                status=PaymentStatus.ORDER_CREATED,
                raw_provider_response=order,
            )
            self.db.add(payment)
            self.db.flush()

            self.db.add(
                PaymentEvent(
                    payment_id=payment.id,
                    event_type="ORDER_CREATED",
                    raw_payload=order,
                )
            )

            self.db.commit()
            self.db.refresh(payment)
            return payment, order
        except HTTPException:
            self.db.rollback()
            raise
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate payment order detected",
            ) from exc
        except Exception as exc:
            self.db.rollback()
            logger.exception("create_payment failed for booking_id=%s", booking_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payment",
            ) from exc

    def verify_payment(
        self,
        *,
        payment_id: int,
        payload: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Payment:
        now = datetime.now(timezone.utc)
        try:
            payment = (
                self.db.query(Payment)
                .options(joinedload(Payment.booking))
                .filter(Payment.id == payment_id)
                .with_for_update()
                .first()
            )
            if not payment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

            booking = payment.booking
            if not booking:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Payment booking relation is missing",
                )
            if user_id and booking.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to verify this payment",
                )

            if booking.status == BookingStatus.PENDING and booking.expires_at < now:
                booking.status = BookingStatus.EXPIRED
                payment.status = PaymentStatus.FAILED
                self._record_event(
                    payment=payment,
                    event_type="VERIFY_REJECTED_EXPIRED",
                    payload=payload,
                )
                self.db.commit()
                self.db.refresh(payment)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Booking has expired",
                )
            if booking.status not in (BookingStatus.PENDING, BookingStatus.CONFIRMED):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot verify payment for booking in {booking.status} state",
                )

            # Idempotent success behavior.
            if payment.status == PaymentStatus.SUCCESS:
                self._record_event(payment=payment, event_type="VERIFY_DUPLICATE", payload=payload)
                self.db.commit()
                self.db.refresh(payment)
                return payment

            provider_payment_id = payload.get("provider_payment_id")
            provider_signature = payload.get("provider_signature")

            verified = self.provider.verify_signature(
                payload=payload,
                signature=provider_signature,
                provider_order_id=payment.provider_order_id,
                provider_payment_id=provider_payment_id,
            )

            self._record_event(payment=payment, event_type="VERIFY_REQUEST", payload=payload)

            if verified:
                payment.status = PaymentStatus.SUCCESS
                payment.provider_payment_id = provider_payment_id or payment.provider_payment_id
                payment.provider_signature = provider_signature
                payment.raw_provider_response = payload
                if booking.status == BookingStatus.PENDING:
                    booking.status = BookingStatus.CONFIRMED
            else:
                payment.status = PaymentStatus.FAILED
                payment.provider_signature = provider_signature
                payment.raw_provider_response = payload

            self.db.commit()
            self.db.refresh(payment)
            return payment
        except HTTPException:
            self.db.rollback()
            raise
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate provider payment ID",
            ) from exc
        except Exception as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to verify payment",
            ) from exc

    def process_webhook(
        self,
        *,
        payload: Dict[str, Any],
        headers: Mapping[str, str],
        raw_body: Optional[str] = None,
    ) -> Dict[str, Any]:
        parsed = self.provider.parse_webhook(payload=payload, headers=headers)

        try:
            payment = self._find_payment_for_webhook(parsed)
            if not payment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Payment not found for webhook payload",
                )

            signature_valid = self.provider.verify_signature(
                payload=parsed.raw_payload,
                signature=parsed.signature,
                provider_order_id=parsed.provider_order_id or payment.provider_order_id,
                provider_payment_id=parsed.provider_payment_id or payment.provider_payment_id,
                raw_body=raw_body,
            )
            if not signature_valid:
                self._record_event(
                    payment=payment,
                    event_type=f"{parsed.event_type}.INVALID_SIGNATURE",
                    payload=parsed.raw_payload,
                )
                self.db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid webhook signature",
                )

            self._record_event(
                payment=payment,
                event_type=parsed.event_type,
                payload=parsed.raw_payload,
            )

            # Duplicate webhooks should not duplicate financial side effects.
            if payment.status == PaymentStatus.SUCCESS and parsed.status_hint == "SUCCESS":
                self.db.commit()
                return {"processed": False, "reason": "duplicate_success_webhook"}

            target_status = self._map_status_hint(parsed.status_hint)
            if target_status:
                payment.status = target_status
            if parsed.provider_payment_id:
                payment.provider_payment_id = parsed.provider_payment_id
            payment.provider_signature = parsed.signature
            payment.raw_provider_response = parsed.raw_payload

            if target_status == PaymentStatus.SUCCESS and payment.booking.status == BookingStatus.PENDING:
                payment.booking.status = BookingStatus.CONFIRMED

            self.db.commit()
            self.db.refresh(payment)
            return {"processed": True, "payment_id": payment.id, "status": payment.status.value}
        except HTTPException:
            self.db.rollback()
            raise
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Webhook caused duplicate provider payment ID",
            ) from exc
        except Exception as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process webhook",
            ) from exc

    def _find_payment_for_webhook(self, parsed: ParsedWebhook) -> Optional[Payment]:
        query = self.db.query(Payment).options(joinedload(Payment.booking))
        payment = None
        if parsed.provider_order_id:
            payment = (
                query.filter(Payment.provider_order_id == parsed.provider_order_id)
                .with_for_update()
                .first()
            )
        if not payment and parsed.provider_payment_id:
            payment = (
                query.filter(Payment.provider_payment_id == parsed.provider_payment_id)
                .with_for_update()
                .first()
            )
        return payment

    def _record_event(self, *, payment: Payment, event_type: str, payload: Dict[str, Any]) -> None:
        self.db.add(
            PaymentEvent(
                payment_id=payment.id,
                event_type=event_type,
                raw_payload=payload,
            )
        )

    def request_refund(
        self,
        *,
        payment_id: int,
        organizer_id: str,
        reason: Optional[str] = None,
    ) -> Payment:
        """Mark a successful payment as refunded (organizer scope enforced via trip ownership)."""
        payment = (
            self.db.query(Payment)
            .options(joinedload(Payment.booking).joinedload(Booking.trip))
            .filter(Payment.id == payment_id)
            .with_for_update()
            .first()
        )
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

        booking = payment.booking
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment booking relation is missing",
            )
        trip = booking.trip
        if not trip or trip.organizer_id != organizer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to refund this payment",
            )

        if payment.status == PaymentStatus.REFUNDED:
            self.db.refresh(payment)
            return payment

        if payment.status != PaymentStatus.SUCCESS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only successful payments can be refunded",
            )

        payment.status = PaymentStatus.REFUNDED
        self._record_event(
            payment=payment,
            event_type="MANUAL_REFUND",
            payload={"reason": reason or "", "provider": self.provider.name},
        )
        try:
            self.db.commit()
            self.db.refresh(payment)
            return payment
        except Exception as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record refund",
            ) from exc

    @staticmethod
    def _map_status_hint(status_hint: Optional[str]) -> Optional[PaymentStatus]:
        if not status_hint:
            return None
        normalized = status_hint.upper()
        if normalized == "SUCCESS":
            return PaymentStatus.SUCCESS
        if normalized == "FAILED":
            return PaymentStatus.FAILED
        if normalized == "REFUNDED":
            return PaymentStatus.REFUNDED
        if normalized == "PENDING":
            return PaymentStatus.PENDING
        return None
