"""Provider Messaging Repository Port (Requirement Phase 17).

Providers communicate with customers through booking-linked conversations.
This port defines the messaging operations a provider can perform.
"""
from __future__ import annotations

from typing import Any, Protocol


class ProviderMessagingRepository(Protocol):
    """Messaging operations scoped to an authenticated provider."""

    async def upsert_conversation(self, provider_id: str, booking_id: str) -> Any | None:
        """Open-or-fetch the booking's conversation (provider-scoped)."""
        ...

    async def list_messages(
        self, provider_id: str, conversation_id: str, limit: int = 50, offset: int = 0
    ) -> list[dict[str, Any]]:
        """List messages chronologically; marks customer messages as read."""
        ...

    async def send_message(
        self, provider_id: str, conversation_id: str, body: str
    ) -> Any | None:
        """Provider posts a message to the conversation."""
        ...

    async def unread_count(self, provider_id: str, conversation_id: str) -> int:
        """Count customer messages not yet read by the provider."""
        ...
