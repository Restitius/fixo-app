"""MessagingRepository — persistence port for booking conversations.

CUS.MESSAGES.* IDs live only in MessagingSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class MessagingRepository(Protocol):
    async def open_conversation(
        self, customer_id: str, booking_id: str
    ) -> dict[str, Any] | None: ...
    async def send_as_customer(
        self, customer_id: str, conversation_id: str, body: str
    ) -> dict[str, Any] | None: ...
    async def list_thread(
        self, customer_id: str, conversation_id: str,
        *, limit: int = 50, offset: int = 0
    ) -> list[dict[str, Any]]: ...
    async def unread_count(self, customer_id: str, conversation_id: str) -> int: ...