"""MessagingSqlAdapter — implements MessagingRepository via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class MessageQueryIds:
    CONVERSATION = "CUS.MESSAGES.CONVERSATION.GET"
    SEND = "CUS.MESSAGES.SEND"
    LIST = "CUS.MESSAGES.LIST"
    UNREAD = "CUS.MESSAGES.UNREAD_COUNT"


class MessagingSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def open_conversation(
        self, customer_id: str, booking_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            MessageQueryIds.CONVERSATION,
            {"customer_id": customer_id, "booking_id": booking_id},
            fetch="one",
        )

    async def send_as_customer(
        self, customer_id: str, conversation_id: str, body: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            MessageQueryIds.SEND,
            {"customer_id": customer_id, "conversation_id": conversation_id,
             "body": body},
            fetch="one",
        )

    async def list_thread(
        self, customer_id: str, conversation_id: str,
        *, limit: int = 50, offset: int = 0
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            MessageQueryIds.LIST,
            {"customer_id": customer_id, "conversation_id": conversation_id,
             "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])

    async def unread_count(self, customer_id: str, conversation_id: str) -> int:
        row = await self._sql.execute(
            MessageQueryIds.UNREAD,
            {"customer_id": customer_id, "conversation_id": conversation_id},
            fetch="one",
        )
        return int((row or {}).get("unread_count") or 0)