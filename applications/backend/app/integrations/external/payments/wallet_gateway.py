"""WalletPaymentGateway — pays for bookings from the customer's FIXO wallet.

authorize  reserves the amount by debiting the wallet (ledger reference BOOKING_PAYMENT)
capture    settles any difference between the held and final agreed amount
refund     credits the wallet back once per booking (ledger reference BOOKING_REFUND)
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any


class WalletPaymentGateway:
    gateway_name = "WALLET"

    def __init__(self, wallet_service_factory: Callable[[], Any]) -> None:
        self._factory = wallet_service_factory

    async def authorize(
        self, payment_id: str, amount_cents: int, currency: str, **context: Any
    ) -> dict[str, Any]:
        customer_id, booking_id = context.get("customer_id"), context.get("booking_id")
        if amount_cents <= 0 or not customer_id or not booking_id:
            return self._failed("Invalid wallet payment request")
        wallet = self._factory()
        try:
            await wallet.debit(
                str(customer_id), amount_cents / 100,
                reference_type="BOOKING_PAYMENT", reference_id=str(booking_id),
                description="Booking payment (held until the job is completed)",
            )
        except ValueError as exc:
            return self._failed(str(exc))
        return {
            "authorized": True, "gateway_ref": f"WALLET-AUTH-{str(payment_id)[:8].upper()}",
            "failure_reason": None, "gateway": self.gateway_name, "payment_id": payment_id,
        }

    async def capture(self, authorization_ref: str, amount_cents: int, **context: Any) -> dict[str, Any]:
        customer_id, booking_id = context.get("customer_id"), context.get("booking_id")
        held_cents = context.get("held_cents")
        if amount_cents <= 0 or not customer_id or not booking_id or held_cents is None:
            return {"captured": False, "failure_reason": "Invalid wallet capture request",
                    "gateway": self.gateway_name}
        wallet = self._factory()
        delta = int(amount_cents) - int(held_cents)
        try:
            if delta > 0:
                await wallet.debit(
                    str(customer_id), delta / 100, reference_type="BOOKING_PAYMENT",
                    reference_id=str(booking_id),
                    description="Additional amount approved during the job",
                )
            elif delta < 0:
                await wallet.credit(
                    str(customer_id), -delta / 100, reference_type="BOOKING_ADJUSTMENT",
                    reference_id=str(booking_id),
                    description="Held amount above the final price returned",
                )
        except ValueError as exc:
            return {"captured": False, "failure_reason": str(exc), "gateway": self.gateway_name}
        return {
            "captured": True, "capture_ref": f"WALLET-CAP-{str(authorization_ref)[-8:]}",
            "gateway": self.gateway_name, "authorization_ref": authorization_ref,
        }

    async def refund(
        self, payment_ref: str, amount_cents: int, reason: str | None = None, **context: Any
    ) -> dict[str, Any]:
        customer_id, booking_id = context.get("customer_id"), context.get("booking_id")
        if amount_cents <= 0 or not customer_id or not booking_id:
            return {"refunded": False, "gateway": self.gateway_name, "amount_cents": 0}
        row = await self._factory().refund_booking(
            str(customer_id), amount_cents / 100, str(booking_id),
            reason or "Refund for a cancelled booking",
        )
        return {"refunded": row is not None, "gateway": self.gateway_name, "amount_cents": amount_cents}

    def _failed(self, reason: str) -> dict[str, Any]:
        return {"authorized": False, "gateway_ref": None, "failure_reason": reason,
                "gateway": self.gateway_name}
