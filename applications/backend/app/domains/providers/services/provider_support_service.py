"""ProviderSupportService - business rules for provider support (ports only)."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_support_repository import ProviderSupportRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError

_CATEGORIES = {"GENERAL", "BILLING", "ACCOUNT", "TECHNICAL", "BOOKING", "PAYOUT", "OTHER"}
_PRIORITIES = {"LOW", "MEDIUM", "HIGH", "URGENT"}
_SENDERS = {"PROVIDER", "SUPPORT"}


class ProviderSupportService:
    """Bridges provider intents to the support repository port.

    The service only touches business concepts (ticket, message, priority);
    the query IDs live in the adapter layer below.
    """

    def __init__(self, repository: ProviderSupportRepositoryPort) -> None:
        self._repo = repository

    async def create_ticket(
        self, provider_id: str, subject: str, category: str, priority: str
    ) -> dict[str, Any]:
        subject = (subject or "").strip()
        category = (category or "GENERAL").upper()
        priority = (priority or "MEDIUM").upper()
        if not 3 <= len(subject) <= 200:
            raise ValueError("Subject must be 3-200 characters")
        if category not in _CATEGORIES:
            raise ValueError(f"Unknown category '{category}'")
        if priority not in _PRIORITIES:
            raise ValueError(f"Unknown priority '{priority}'")
        ticket = await self._repo.create_ticket(
            provider_id=provider_id, subject=subject, category=category, priority=priority
        )
        if ticket is None:
            raise RuntimeError("Failed to open support ticket")
        return ticket

    async def list_tickets(
        self, provider_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._repo.list_tickets(provider_id, limit=limit, offset=offset)

    async def get_ticket(self, ticket_id: str, provider_id: str) -> dict[str, Any]:
        ticket = await self._repo.get_ticket(ticket_id=ticket_id, provider_id=provider_id)
        if ticket is None:
            raise NotFoundError("Ticket not found")
        return ticket

    async def add_message(
        self, ticket_id: str, provider_id: str, sender: str, body: str
    ) -> dict[str, Any]:
        await self.get_ticket(ticket_id, provider_id)
        sender = (sender or "").upper()
        body = (body or "").strip()
        if sender not in _SENDERS:
            raise ValueError(f"Unknown sender '{sender}'")
        if not 1 <= len(body) <= 4000:
            raise ValueError("Message body must be 1-4000 characters")
        message = await self._repo.add_message(
            ticket_id=ticket_id, provider_id=provider_id, sender=sender, body=body
        )
        if message is None:
            raise ConflictError("Ticket is closed and no longer accepts messages")
        return message

    async def list_messages(
        self, ticket_id: str, provider_id: str, limit: int = 100, offset: int = 0
    ) -> list[dict[str, Any]]:
        await self.get_ticket(ticket_id, provider_id)
        return await self._repo.list_messages(
            ticket_id=ticket_id, provider_id=provider_id, limit=limit, offset=offset
        )
