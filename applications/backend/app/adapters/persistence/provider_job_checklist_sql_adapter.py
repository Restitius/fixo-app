"""ProviderJobChecklistSqlAdapter — implemented via governed queries (Phase 21).

The only code that knows PROV.CHECKLIST.* query ids. JSONB items are
serialised/deserialised here; task titles are stored as plain JSON strings.
"""
from __future__ import annotations

import json
from typing import Any


class ProviderJobChecklistQueryIds:
    TEMPLATE_UPSERT = "PROV.CHECKLIST.TEMPLATE.UPSERT"
    TEMPLATE_GET = "PROV.CHECKLIST.TEMPLATE.GET"
    TEMPLATE_DELETE = "PROV.CHECKLIST.TEMPLATE.DELETE"
    INSTANTIATE = "PROV.CHECKLIST.INSTANTIATE"
    BOOKING_LIST = "PROV.CHECKLIST.BOOKING_LIST"
    BOOKING_SET_COMPLETED = "PROV.CHECKLIST.BOOKING_SET_COMPLETED"
    BOOKING_PROGRESS = "PROV.CHECKLIST.BOOKING_PROGRESS"


class ProviderJobChecklistSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def template_upsert(
        self,
        provider_id: str,
        service_id: str,
        title: str,
        items: list[str],
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobChecklistQueryIds.TEMPLATE_UPSERT,
            {
                "user_id": provider_id,
                "service_id": service_id,
                "title": title,
                "items": json.dumps(items),
            },
            fetch="one",
        )

    async def template_get(
        self, provider_id: str, service_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobChecklistQueryIds.TEMPLATE_GET,
            {"user_id": provider_id, "service_id": service_id},
            fetch="one",
        )

    async def template_delete(
        self, provider_id: str, service_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobChecklistQueryIds.TEMPLATE_DELETE,
            {"user_id": provider_id, "service_id": service_id},
            fetch="one",
        )

    async def instantiate(
        self, provider_id: str, booking_id: str, service_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderJobChecklistQueryIds.INSTANTIATE,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "service_id": service_id,
            },
            fetch="all",
        )
        return list(rows or [])

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderJobChecklistQueryIds.BOOKING_LIST,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="all",
        )
        return list(rows or [])

    async def set_completed(
        self,
        provider_id: str,
        booking_id: str,
        item_id: str,
        is_completed: bool,
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobChecklistQueryIds.BOOKING_SET_COMPLETED,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "item_id": item_id,
                "is_completed": is_completed,
            },
            fetch="one",
        )

    async def progress(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobChecklistQueryIds.BOOKING_PROGRESS,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )