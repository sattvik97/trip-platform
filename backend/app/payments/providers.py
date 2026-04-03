import hashlib
import hmac
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, Mapping, Optional


@dataclass
class ParsedWebhook:
    event_type: str
    provider_order_id: Optional[str]
    provider_payment_id: Optional[str]
    signature: Optional[str]
    status_hint: Optional[str]
    raw_payload: Dict[str, Any]


class PaymentProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name persisted in DB."""

    @abstractmethod
    def create_order(
        self,
        *,
        booking_id: str,
        amount: Decimal,
        currency: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create provider order for a booking payment attempt."""

    @abstractmethod
    def verify_signature(
        self,
        *,
        payload: Dict[str, Any],
        signature: Optional[str],
        provider_order_id: Optional[str],
        provider_payment_id: Optional[str],
        raw_body: Optional[str] = None,
    ) -> bool:
        """Validate callback/webhook signature."""

    @abstractmethod
    def parse_webhook(
        self,
        *,
        payload: Dict[str, Any],
        headers: Mapping[str, str],
    ) -> ParsedWebhook:
        """Parse raw webhook payload into a provider-agnostic object."""


class MockProvider(PaymentProvider):
    @property
    def name(self) -> str:
        return "MOCK"

    def create_order(
        self,
        *,
        booking_id: str,
        amount: Decimal,
        currency: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # JSON columns cannot store Decimal; persist string for audit payloads.
        return {
            "order_id": f"mock_order_{booking_id}_{int(time.time() * 1000)}",
            "amount": str(amount),
            "currency": currency,
            "metadata": metadata or {},
        }

    def verify_signature(
        self,
        *,
        payload: Dict[str, Any],
        signature: Optional[str],
        provider_order_id: Optional[str],
        provider_payment_id: Optional[str],
        raw_body: Optional[str] = None,
    ) -> bool:
        # Mock provider is always valid for local/integration flows.
        return True

    def parse_webhook(
        self,
        *,
        payload: Dict[str, Any],
        headers: Mapping[str, str],
    ) -> ParsedWebhook:
        return ParsedWebhook(
            event_type=str(payload.get("event_type", "mock.payment")),
            provider_order_id=payload.get("provider_order_id"),
            provider_payment_id=payload.get("provider_payment_id"),
            signature=headers.get("x-mock-signature"),
            status_hint=payload.get("status"),
            raw_payload=payload,
        )


class RazorpayProvider(PaymentProvider):
    def __init__(self, *, key_id: str, key_secret: str, webhook_secret: str):
        self.key_id = key_id
        self.key_secret = key_secret
        self.webhook_secret = webhook_secret

    @property
    def name(self) -> str:
        return "RAZORPAY"

    def create_order(
        self,
        *,
        booking_id: str,
        amount: Decimal,
        currency: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # Structure-only implementation.
        raise NotImplementedError(
            "Razorpay order creation is not wired yet. Integrate Razorpay SDK/client in this method."
        )

    def verify_signature(
        self,
        *,
        payload: Dict[str, Any],
        signature: Optional[str],
        provider_order_id: Optional[str],
        provider_payment_id: Optional[str],
        raw_body: Optional[str] = None,
    ) -> bool:
        if not signature:
            return False

        if provider_order_id and provider_payment_id and self.key_secret:
            message = f"{provider_order_id}|{provider_payment_id}".encode("utf-8")
            expected = hmac.new(
                self.key_secret.encode("utf-8"),
                msg=message,
                digestmod=hashlib.sha256,
            ).hexdigest()
            return hmac.compare_digest(expected, signature)

        if self.webhook_secret and raw_body is not None:
            body = raw_body.encode("utf-8")
            expected = hmac.new(
                self.webhook_secret.encode("utf-8"),
                msg=body,
                digestmod=hashlib.sha256,
            ).hexdigest()
            return hmac.compare_digest(expected, signature)

        return False

    def parse_webhook(
        self,
        *,
        payload: Dict[str, Any],
        headers: Mapping[str, str],
    ) -> ParsedWebhook:
        signature = (
            headers.get("x-razorpay-signature")
            or headers.get("X-Razorpay-Signature")
        )
        event_type = str(payload.get("event", "razorpay.unknown"))

        provider_order_id = None
        provider_payment_id = None

        payment_entity = (
            payload.get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )
        if isinstance(payment_entity, dict):
            provider_order_id = payment_entity.get("order_id")
            provider_payment_id = payment_entity.get("id")

        return ParsedWebhook(
            event_type=event_type,
            provider_order_id=provider_order_id,
            provider_payment_id=provider_payment_id,
            signature=signature,
            status_hint=self._status_hint_from_event(event_type),
            raw_payload=payload,
        )

    @staticmethod
    def _status_hint_from_event(event_type: str) -> Optional[str]:
        if event_type in {"payment.captured", "order.paid"}:
            return "SUCCESS"
        if event_type in {"payment.failed"}:
            return "FAILED"
        if event_type in {"refund.processed", "payment.refunded"}:
            return "REFUNDED"
        return None
