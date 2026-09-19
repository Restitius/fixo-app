"""Dispute persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class DisputeRepositoryPort(Protocol):
    async def create_dispute(
        self, booking_id: str, customer_id: str, category: str, description: str
    ) -> dict[str, Any] | None:
        ...

    async def list_disputes(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        ...

    async def get_dispute(self, dispute_id: str, customer_id: str) -> dict[str, Any] | None:
        ...

    async def add_evidence(
        self, dispute_id: str, customer_id: str, kind: str, url: str, note: str | None
    ) -> dict[str, Any] | None:
        ...

    async def list_evidence(self, dispute_id: str, customer_id: str) -> list[dict[str, Any]]:
        ...

    async def withdraw_dispute(self, dispute_id: str, customer_id: str) -> dict[str, Any] | None:
        ...
