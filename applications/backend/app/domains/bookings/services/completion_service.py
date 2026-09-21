"""CompletionService — Module 53 (atomic booking close).

Triggers the Phase 16 atomic completion: wallet credit + loyalty earn + close,
all inside SP_CLOSE_BOOKING in a single PostgreSQL transaction.
"""
from __future__ import annotations

from typing import Any, Protocol

from app.ports.persistence.booking_repository import BookingRepository
from app.ports.persistence.phase16_ports import BookingClosePort


class _WorkflowPort(Protocol):
    async def transition(self, workflow_id: str, from_state: str, to_state: str) -> None: ...


class CompletionService:
    def __init__(self, close_port: BookingClosePort, bookings: BookingRepository, workflows: _WorkflowPort | None = None) -> None:
        self._close_port = close_port
        self._bookings = bookings
        self._workflows = workflows

    async def confirm_completion(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        """Module 25 — customer confirms service completion from COMPLETION_REQUESTED."""
        booking = await self._bookings.get(customer_id, booking_id)
        if booking["status"] != "COMPLETION_REQUESTED":
            raise ValueError(f"Booking in status '{booking['status']}' cannot confirm completion")
        await self._bookings.mark_completed(booking_id, customer_id)
        if self._workflows:
            await self._workflows.transition(
                "WF.SERVICE_REQUEST.V1", "COMPLETION_REQUESTED", "CUSTOMER_CONFIRMED"
            )
        return {"booking_id": booking_id, "status": "CUSTOMER_CONFIRMED"}

    async def close_booking(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        """Module 53 — atomic financial completion via SP_CLOSE_BOOKING."""
        booking = await self._bookings.get(customer_id, booking_id)
        if booking["status"] not in ("FINAL_PAYMENT_PENDING", "PAID"):
            raise ValueError(f"Booking in status '{booking['status']}' cannot be closed")
        result = await self._close_port.close_booking(booking_id)
        if result is None:
            raise ValueError("Booking cannot be closed — SP_CLOSE_BOOKING returned no result")
        if self._workflows:
            await self._workflows.transition(
                "WF.SERVICE_EXECUTION.V1", booking["status"], "CLOSED"
            )
            await self._workflows.transition(
                "WF.BOOKING.CUSTOMER.V1", "FINAL_PAYMENT_PENDING", "PAID"
            )
        return result