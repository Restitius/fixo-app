"""ProviderNotificationsSqlAdapter — implemented via governed queries (Phase 32).

The only code that knows PROV.NOTIFICATIONS.* query ids.
"""
from __future__ import annotations

from typing import Any


class ProviderNotificationsQueryIds:
    LIST = "PROV.NOTIFICATIONS.LIST"
    UNREAD_COUNT = "PROV.NOTIFICATIONS.UNREAD_COUNT"
    MARK_READ = "PROV.NOTIFICATIONS.MARK_READ"


class ProviderNotificationsSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderNotificationsQueryIds.LIST,
            {
                "provider_id": provider_id,
                "status": status,
                "category": category,
                "limit": limit,
                "offset": offset,
            },
            fetch="all",
        )
        return list(rows or [])

    async def unread_count(self, provider_id: str) -> int:
        row = await self._sql.execute(
            ProviderNotificationsQueryIds.UNREAD_COUNT,
            {"provider_id": provider_id},
            fetch="one",
        )
        return int(row.get("unread_count") or 0) if row else 0

    async def mark_read(
        self, provider_id: str, notification_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderNotificationsQueryIds.MARK_READ,
            {"provider_id": provider_id, "notification_id": notification_id},
            fetch="one",
        )
