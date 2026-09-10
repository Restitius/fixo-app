"""ProviderJobChecklistRepository — persistence port for provider job checklists.

PROV.CHECKLIST.* IDs live only in ProviderJobChecklistSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderJobChecklistRepository(Protocol):
    async def template_upsert(
        self,
        provider_id: str,
        service_id: str,
        title: str,
        items: list[str],
    ) -> dict[str, Any] | None: ...

    async def template_get(
        self, provider_id: str, service_id: str
    ) -> dict[str, Any] | None: ...

    async def template_delete(
        self, provider_id: str, service_id: str
    ) -> dict[str, Any] | None: ...

    async def instantiate(
        self, provider_id: str, booking_id: str, service_id: str
    ) -> list[dict[str, Any]]: ...

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]: ...

    async def set_completed(
        self,
        provider_id: str,
        booking_id: str,
        item_id: str,
        is_completed: bool,
    ) -> dict[str, Any] | None: ...

    async def progress(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None: ...