"""Provider job-assignments persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderJobAssignmentsRepositoryPort(Protocol):
    async def create(
        self, provider_id: str, *, booking_id: str, member_id: str, notes: str | None
    ) -> dict[str, Any] | None:
        ...

    async def list_assignments(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        member_id: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        ...

    async def get(self, provider_id: str, *, assignment_id: str) -> dict[str, Any] | None:
        ...

    async def update(
        self,
        provider_id: str,
        *,
        assignment_id: str,
        member_id: str | None = None,
        status: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any] | None:
        ...

    async def cancel(self, provider_id: str, *, assignment_id: str) -> dict[str, Any] | None:
        ...
