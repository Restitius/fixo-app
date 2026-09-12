"""ProviderNotificationsSqlAdapter — SQL-backed implementation of ProviderNotificationsRepository.

Routes operations through governed queries:
- PROV.NOTIFICATIONS.LIST         — provider notification listing
- PROV.NOTIFICATIONS.GET          — single item fetch (ownership-scoped)
- PROV.NOTIFICATIONS.MARK_READ    — mark as read (idempotent)
- PROV.NOTIFICATIONS.UNREAD_COUNT — count unread
"""

from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_notifications_repository import ProviderNotificationsRepository


class ProviderNotificationsSqlAdapter(ProviderNotificationsRepository):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]:
        """List provider notifications, newest first."""
        return await self._queries.execute(
            "PROV.NOTIFICATIONS.LIST",
            {
                "user_id": provider_id,
                "status": status,
                "category": category,
                "limit": limit,
                "offset": offset,
            },
        )

    async def get(self, provider_id: str, *, notification_id: str) -> Any | None:
        """Fetch a single notification by id (ownership-scoped)."""
        rows = await self._queries.execute(
            "PROV.NOTIFICATIONS.GET",
            {"user_id": provider_id, "notification_id": notification_id},
        )
        return rows[0] if rows else None

    async def mark_read(self, provider_id: str, *, notification_id: str) -> Any | None:
        """Mark a notification as read (idempotent)."""
        rows = await self._queries.execute(
            "PROV.NOTIFICATIONS.MARK_READ",
            {"user_id": provider_id, "notification_id": notification_id},
        )
        return rows[0] if rows else None

    async def unread_count(self, provider_id: str) -> int:
        """Return the count of unread notifications for a provider."""
        rows = await self._queries.execute(
            "PROV.NOTIFICATIONS.UNREAD_COUNT",
            {"user_id": provider_id},
        )
        if rows and rows[0]:
            return int(rows[0].get("unread_count", 0))
        return 0