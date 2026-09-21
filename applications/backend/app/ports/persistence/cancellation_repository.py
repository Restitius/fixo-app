"""Cancellation persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class CancellationRepositoryPort(Protocol):
    async def preview_booking(self, booking_id: str, customer_id: str) -> dict[str, Any] | None:
        ...

    async def cancel_booking(
        self, booking_id: str, customer_id: str, fee: float, refund: float, reason: str
    ) -> dict[str, Any] | None:
        ...

    async def record_cancellation(
        self,
        booking_id: str,
        customer_id: str,
        fee: float,
        refund: float,
        reason: str,
        requested_by: str,
    ) -> dict[str, Any] | None:
        ...

    async def list_cancellations(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        ...
