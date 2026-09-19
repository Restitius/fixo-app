"""Provider activity-log persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderActivityLogRepositoryPort(Protocol):
    async def record(
        self,
        provider_id: str,
        *,
        action: str,
        entity_type: str | None,
        entity_id: str | None,
        metadata: dict[str, Any] | None,
    ) -> dict[str, Any] | None:
        ...

    async def list_entries(
        self,
        provider_id: str,
        *,
        action_prefix: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        ...
