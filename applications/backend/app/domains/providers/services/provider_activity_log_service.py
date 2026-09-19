"""ProviderActivityLogService - the provider's own activity/audit history.

`record()` is for internal use by other services after a significant
action — there is no public write endpoint, so a provider cannot
fabricate their own audit trail. `list_entries()` is the provider-facing
read path.
"""
from __future__ import annotations

import json
from typing import Any

from app.ports.persistence.provider_activity_log_repository import (
    ProviderActivityLogRepositoryPort,
)


class ProviderActivityLogService:
    def __init__(self, repository: ProviderActivityLogRepositoryPort) -> None:
        self._repo = repository

    async def record(
        self,
        provider_id: str,
        *,
        action: str,
        entity_type: str | None = None,
        entity_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        # asyncpg needs a JSON string (or None) for a JSONB bind — a raw
        # Python dict fails at the driver level, not at the SQL level.
        serialized = json.dumps(metadata) if metadata is not None else None
        return await self._repo.record(
            provider_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=serialized,
        )

    async def list_entries(
        self,
        provider_id: str,
        *,
        action_prefix: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._repo.list_entries(
            provider_id, action_prefix=action_prefix, limit=limit, offset=offset
        )
