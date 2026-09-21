"""PaymentGateway — business payment capability port.

The application/service/payment domain knows ONLY these operations. It does
NOT know the provider (M-Pesa, Airtel Money, Visa, Mastercard, Flutterwave,
Stripe, Pesapal, ...). An adapter maps these to registered INT-* operations.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class PaymentGateway(Protocol):
    """Business-facing payment surface (provider-agnostic)."""

    async def authorize(self, payment_id: str, amount_cents: int, currency: str, **context: Any) -> dict[str, Any]: ...
    async def capture(self, authorization_ref: str, amount_cents: int) -> dict[str, Any]: ...
    async def refund(self, payment_ref: str, amount_cents: int, reason: str | None = None) -> dict[str, Any]: ...