"""Support adapter - the only layer that knows the CUS.SUPPORT.* IDs."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.support_repository import SupportRepositoryPort

_LIMIT_CAP = 100


class SupportSqlAdapter(SupportRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def create_ticket(
        self, customer_id: str, subject: str, category: str, priority: str
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.SUPPORT.TICKET.CREATE",
            {
                "customer_id": customer_id,
                "subject": subject,
                "category": category,
                "priority": priority,
            },
        )
        return rows[0] if rows else None

    async def list_tickets(
        self, customer_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.SUPPORT.TICKET.LIST",
            {
                "customer_id": customer_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get_ticket(self, ticket_id: str, customer_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.SUPPORT.TICKET.GET",
            {"ticket_id": ticket_id, "customer_id": customer_id},
        )
        return rows[0] if rows else None

    async def add_message(
        self, ticket_id: str, customer_id: str, sender: str, body: str
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.SUPPORT.MESSAGE.ADD",
            {
                "ticket_id": ticket_id,
                "customer_id": customer_id,
                "sender": sender,
                "body": body,
            },
        )
        return rows[0] if rows else None

    async def list_messages(
        self, ticket_id: str, customer_id: str, limit: int = 100, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.SUPPORT.MESSAGES.LIST",
            {
                "ticket_id": ticket_id,
                "customer_id": customer_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )
