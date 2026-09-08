"""Provider Messaging Service (Requirement Phase 17).

Orchestrates provider-customer communication through booking-linked conversations.
"""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_messaging_repository import ProviderMessagingRepository
from app.shared.exceptions.hierarchy import NotFoundError, AuthorizationError


class ProviderMessagingService:
    """Provider messaging operations."""

    def __init__(self, messaging: ProviderMessagingRepository) -> None:
        self._messaging = messaging

    async def conversation(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        """Get-or-create the booking's conversation."""
        conv = await self._messaging.upsert_conversation(provider_id, booking_id)
        if not conv:
            raise NotFoundError(f"No booking {booking_id} for this provider")
        return dict(conv)

    async def messages(
        self, provider_id: str, conversation_id: str, limit: int = 50, offset: int = 0
    ) -> list[dict[str, Any]]:
        """List conversation messages (provider-scoped)."""
        return await self._messaging.list_messages(provider_id, conversation_id, limit, offset)

    async def send(self, provider_id: str, conversation_id: str, body: str) -> dict[str, Any]:
        """Send a message from the provider."""
        if not body or not body.strip():
            raise ValueError("Message body cannot be empty")
        msg = await self._messaging.send_message(provider_id, conversation_id, body.strip())
        if not msg:
            raise NotFoundError(f"No conversation {conversation_id} for this provider")
        return dict(msg)

    async def unread(self, provider_id: str, conversation_id: str) -> int:
        """Count unread customer messages."""
        return await self._messaging.unread_count(provider_id, conversation_id)
