"""ProviderChangeRequestRepository — persistence port for provider change requests.

PROV.CHANGE.* IDs live only in ProviderChangeRequestSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderChangeRequestRepository(Protocol):
    async def submit(
        self,
        provider_id: str,
        booking_id: str,
        params: dict[str, Any],
    ) -> dict[str, Any] | None: ...

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]: ...

    async def get_owned(
        self, provider_id: str, change_id: str
    ) -> dict[str, Any] | None: ...

    async def withdraw(
        self, provider_id: str, change_id: str
    ) -> dict[str, Any] | None: ...
