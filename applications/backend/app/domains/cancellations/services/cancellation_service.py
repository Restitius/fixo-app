"""CancellationService - policy engines decide, the guarded SQL enforces."""
from __future__ import annotations

from typing import Any

from app.domains.cancellations.services.cancellation_policy_engine import (
    CancellationOutcome,
    CancellationPolicyEngine,
)
from app.domains.cancellations.services.refund_policy_engine import RefundPolicyEngine
from app.ports.persistence.cancellation_repository import CancellationRepositoryPort
from app.shared.protection_errors import BookingNotCancellable


class CancellationService:
    def __init__(
        self,
        repository: CancellationRepositoryPort,
        policy: CancellationPolicyEngine | None = None,
        refund_policy: RefundPolicyEngine | None = None,
    ) -> None:
        self._repo = repository
        self._policy = policy or CancellationPolicyEngine()
        self._refunds = refund_policy or RefundPolicyEngine()

    def _price(self, booking: dict[str, Any]) -> tuple[CancellationOutcome, float]:
        outcome = self._policy.evaluate(
            booking.get("scheduled_date"), float(booking.get("agreed_amount") or 0)
        )
        refund = self._refunds.compute(float(booking.get("agreed_amount") or 0), outcome.fee)
        return outcome, refund

    async def preview(self, booking_id: str, customer_id: str) -> dict[str, Any]:
        booking = await self._repo.preview_booking(booking_id, customer_id)
        if booking is None:
            raise BookingNotCancellable("Booking not found")
        outcome, refund = self._price(booking)
        return {
            "booking_id": booking_id,
            "status": booking.get("status"),
            "tier": outcome.tier,
            "fee": outcome.fee,
            "refund": refund,
            "explanation": outcome.explanation,
        }

    async def cancel(
        self,
        booking_id: str,
        customer_id: str,
        reason: str,
        requested_by: str = "CUSTOMER",
    ) -> dict[str, Any]:
        booking = await self._repo.preview_booking(booking_id, customer_id)
        if booking is None:
            raise BookingNotCancellable("Booking not found")
        outcome, refund = self._price(booking)
        # The SQL guard has the final say: past-completion bookings cannot flip.
        updated = await self._repo.cancel_booking(
            booking_id, customer_id, outcome.fee, refund, reason
        )
        if updated is None:
            raise BookingNotCancellable("This booking can no longer be cancelled")
        record = await self._repo.record_cancellation(
            booking_id, customer_id, outcome.fee, refund, reason, requested_by
        )
        return {
            "booking": updated,
            "tier": outcome.tier,
            "fee": outcome.fee,
            "refund": refund,
            "record": record,
        }

    async def history(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._repo.list_cancellations(customer_id, limit=limit, offset=offset)
