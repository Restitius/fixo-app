"""Provider support persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderSupportRepositoryPort(Protocol):
    async def create_ticket(
        self, provider_id: str, subject: str, category: str, priority: str
    ) -> dict[str, Any] | None:
        ...

    async def list_tickets(self, provider_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        ...

    async def get_ticket(self, ticket_id: str, provider_id: str) -> dict[str, Any] | None:
        ...

    async def add_message(
        self, ticket_id: str, provider_id: str, sender: str, body: str
    ) -> dict[str, Any] | None:
        ...

    async def list_messages(
        self, ticket_id: str, provider_id: str, limit: int = 100, offset: int = 0
    ) -> list[dict[str, Any]]:
        ...
