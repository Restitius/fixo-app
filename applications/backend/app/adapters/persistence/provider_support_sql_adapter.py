"""Provider support adapter - the only layer that knows the PROV.SUPPORT.* IDs."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.provider_support_repository import ProviderSupportRepositoryPort

_LIMIT_CAP = 100


class ProviderSupportSqlAdapter(ProviderSupportRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def create_ticket(
        self, provider_id: str, subject: str, category: str, priority: str
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SUPPORT.TICKET.CREATE",
            {
                "provider_id": provider_id,
                "subject": subject,
                "category": category,
                "priority": priority,
            },
        )
        return rows[0] if rows else None

    async def list_tickets(
        self, provider_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.SUPPORT.TICKET.LIST",
            {
                "user_id": provider_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get_ticket(self, ticket_id: str, provider_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SUPPORT.TICKET.GET",
            {"ticket_id": ticket_id, "user_id": provider_id},
        )
        return rows[0] if rows else None

    async def add_message(
        self, ticket_id: str, provider_id: str, sender: str, body: str
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SUPPORT.MESSAGE.ADD",
            {
                "ticket_id": ticket_id,
                "user_id": provider_id,
                "sender": sender,
                "body": body,
            },
        )
        return rows[0] if rows else None

    async def list_messages(
        self, ticket_id: str, provider_id: str, limit: int = 100, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.SUPPORT.MESSAGES.LIST",
            {
                "ticket_id": ticket_id,
                "user_id": provider_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )
