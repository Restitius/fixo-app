"""Provider team-management persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderTeamRepositoryPort(Protocol):
    async def create_member(
        self,
        provider_id: str,
        *,
        full_name: str,
        phone: str,
        email: str | None,
        role: str,
        notes: str | None,
    ) -> dict[str, Any] | None:
        ...

    async def list_members(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        role: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        ...

    async def get_member(self, provider_id: str, *, member_id: str) -> dict[str, Any] | None:
        ...

    async def update_member(
        self,
        provider_id: str,
        *,
        member_id: str,
        full_name: str | None = None,
        phone: str | None = None,
        email: str | None = None,
        role: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any] | None:
        ...

    async def deactivate_member(self, provider_id: str, *, member_id: str) -> dict[str, Any] | None:
        ...
