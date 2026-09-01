"""NotificationManager — persisted customer-notification lifecycle.

Platform layer: owns CUS.NOTIFICATIONS.* execution through SQLQueryManager
(managers may touch registries + infrastructure directly). Domains request
notifications via this manager; they never see SQL or IDs.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class NotificationQueryIds:
    CREATE = "CUS.NOTIFICATIONS.CREATE"
    LIST = "CUS.NOTIFICATIONS.LIST"
    MARK_READ = "CUS.NOTIFICATIONS.MARK_READ"
    MARK_ALL = "CUS.NOTIFICATIONS.MARK_ALL"
    UNREAD = "CUS.NOTIFICATIONS.UNREAD_COUNT"


class NotificationManager:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    # -- production (called by domain flows via composition) -------------------

    async def notify(
        self, customer_id: str, *, ntype: str, title: str,
        body: str | None = None, ref_type: str | None = None,
        ref_id: Any | None = None,
    ) -> None:
        await self._sql.execute(
            NotificationQueryIds.CREATE,
            {"customer_id": customer_id, "type": ntype,
             "title": title[:160], "body": (body or "")[:500] or None,
             "ref_type": ref_type, "ref_id": str(ref_id) if ref_id else None},
            fetch="one",
        )

    # -- customer notification-center reads -------------------------------------

    async def list(
        self, customer_id: str, *, unread_only: bool = False,
        limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            NotificationQueryIds.LIST,
            {"customer_id": customer_id, "unread_only": unread_only,
             "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])

    async def mark_read(self, customer_id: str, notification_id: str) -> bool:
        row = await self._sql.execute(
            NotificationQueryIds.MARK_READ,
            {"customer_id": customer_id, "notification_id": notification_id},
            fetch="one",
        )
        return bool(row)

    async def mark_all(self, customer_id: str) -> int:
        row = await self._sql.execute(
            NotificationQueryIds.MARK_ALL,
            {"customer_id": customer_id},
            fetch="one",
        )
        return int((row or {}).get("marked") or 0)

    async def unread_count(self, customer_id: str) -> int:
        row = await self._sql.execute(
            NotificationQueryIds.UNREAD,
            {"customer_id": customer_id},
            fetch="one",
        )
        return int((row or {}).get("unread_count") or 0)