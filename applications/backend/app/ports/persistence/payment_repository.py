"""PaymentRepository — persistence port for payment attempts."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class PaymentRepository(Protocol):
    async def create_attempt(
        self, customer_id: str, booking_id: str, gateway: str
    ) -> dict[str, Any] | None:
        """Open INITIATED attempt; returns {payment_id, attempt_no}."""

    async def set_result(
        self, customer_id: str, booking_id: str, payment_id: str,
        *, result: str, gateway_ref: str | None, failure_reason: str | None
    ) -> bool: ...

    async def get_authorization(
        self, customer_id: str, booking_id: str
    ) -> dict[str, Any] | None:
        """Return the live AUTHORIZED, uncaptured attempt's payment_id + ref."""

    async def mark_captured(
        self, customer_id: str, payment_id: str, capture_ref: str | None
    ) -> bool: ...