"""BookingRepository — persistence port for the booking aggregate.

CUS.BOOKING.* IDs live only in BookingSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class BookingRepository(Protocol):
    async def create(self, customer_id: str, quote_id: str) -> dict[str, Any] | None: ...
    async def get(self, customer_id: str, booking_id: str) -> dict[str, Any] | None: ...
    async def list(
        self, customer_id: str, *, status: str | None = None,
        limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]: ...
    async def set_status(
        self, customer_id: str, booking_id: str,
        *, from_state: str, to_state: str
    ) -> dict[str, Any] | None: ...
    async def close(self, customer_id: str, booking_id: str) -> dict[str, Any] | None: ...
    async def add_timeline(
        self, customer_id: str, booking_id: str,
        event: str, detail: str | None = None
    ) -> bool: ...
    async def timeline(self, customer_id: str, booking_id: str) -> list[dict[str, Any]]: ...