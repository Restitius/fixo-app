"""PaymentSettlementService — releases/refunds the money held for a booking."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class PaymentSettlementService:
    def __init__(self, payments: Any, gateway: Any) -> None:
        self._payments = payments
        self._gateway = gateway

    async def release(
        self, customer_id: str, booking_id: str, refund_amount: float, reason: str | None = None
    ) -> dict[str, Any] | None:
        """Give back `refund_amount` of what was held for the booking (best effort)."""
        auth = await self._payments.get_authorization(customer_id, booking_id)
        if not auth or not auth.get("gateway_ref"):
            return None
        try:
            return await self._gateway.refund(
                str(auth["gateway_ref"]), int(round(float(refund_amount) * 100)), reason,
                customer_id=customer_id, booking_id=booking_id,
            )
        except Exception as exc:  # noqa: BLE001 - a refund hiccup must not undo the cancellation
            logger.error("refund failed for booking %s: %s", booking_id, exc)
            return None
