"""ProviderBookingRepository — persistence port for provider-side booking views.

PROV.BOOKING.* IDs live only in ProviderBookingSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderBookingRepository(Protocol):
    async def feed(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]: ...

    async def get(self, provider_id: str, booking_id: str) -> dict[str, Any] | None: ...

    async def ack(
        self, provider_id: str, booking_id: str, notes: str | None = None
    ) -> dict[str, Any] | None: ...

    async def ack_status(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None: ...

    async def details(self, provider_id: str, booking_id: str) -> dict[str, Any] | None: ...

    async def timeline(self, provider_id: str, booking_id: str) -> list[dict[str, Any]]: ...

    async def message_count(self, provider_id: str, booking_id: str) -> dict[str, Any] | None: ...
