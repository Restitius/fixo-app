"""ProviderNotificationsRepository — persistence port for provider notifications.

PROV.NOTIFICATIONS.* IDs live only in ProviderNotificationsSqlAdapter.
Phase 32 exposes provider-facing notification history/list + read state:
list (optionally filtered by status/category), unread count, and idempotent
mark-read.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderNotificationsRepository(Protocol):
    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]: ...

    async def unread_count(self, provider_id: str) -> int: ...

    async def mark_read(
        self, provider_id: str, notification_id: str
    ) -> dict[str, Any] | None: ...
