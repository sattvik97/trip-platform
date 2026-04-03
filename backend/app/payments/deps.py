from app.core.config import settings
from app.payments.providers import MockProvider, PaymentProvider, RazorpayProvider


def get_payment_provider() -> PaymentProvider:
    if settings.PAYMENT_PROVIDER == "RAZORPAY":
        return RazorpayProvider(
            key_id=settings.RAZORPAY_KEY_ID,
            key_secret=settings.RAZORPAY_KEY_SECRET,
            webhook_secret=settings.RAZORPAY_WEBHOOK_SECRET,
        )
    return MockProvider()
