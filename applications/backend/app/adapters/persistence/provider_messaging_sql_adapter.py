"""Provider Messaging SQL Adapter (Requirement Phase 17).

Implements ProviderMessagingRepository against CONVERSATIONS/MESSAGES tables.
All queries are provider-scoped (ownership filter binds :user_id).
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderMessagingQueryIds:
    """Query IDs for provider messaging operations."""

    UPSERT_CONVERSATION = "PROV.MESSAGES.CONVERSATION.GET"
    LIST_MESSAGES = "PROV.MESSAGES.LIST"
    SEND_MESSAGE = "PROV.MESSAGES.SEND"
    UNREAD_COUNT = "PROV.MESSAGES.UNREAD_COUNT"


class ProviderMessagingSqlAdapter:
    """SQL-backed provider messaging repository."""

    def __init__(self, sql_query_manager: SQLQueryManager) -> None:
        self._sql = sql_query_manager

    async def upsert_conversation(self, provider_id: str, booking_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderMessagingQueryIds.UPSERT_CONVERSATION,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )

    async def list_messages(
        self, provider_id: str, conversation_id: str, limit: int = 50, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderMessagingQueryIds.LIST_MESSAGES,
            {"user_id": provider_id, "conversation_id": conversation_id, "limit": limit, "offset": offset},
            fetch="all",
        ) or []

    async def send_message(
        self, provider_id: str, conversation_id: str, body: str
    ) -> Any | None:
        return await self._sql.execute(
            ProviderMessagingQueryIds.SEND_MESSAGE,
            {"user_id": provider_id, "conversation_id": conversation_id, "body": body},
            fetch="one",
        )

    async def unread_count(self, provider_id: str, conversation_id: str) -> int:
        row = await self._sql.execute(
            ProviderMessagingQueryIds.UNREAD_COUNT,
            {"user_id": provider_id, "conversation_id": conversation_id},
            fetch="one",
        )
        return int(row["unread_count"]) if row else 0
