"""ProviderActivityLogSqlAdapter - the only layer that knows the PROV.ACTIVITY_LOG.* IDs.

The `metadata` value must already be a JSON string (or None) by the time
it reaches this adapter — asyncpg does not auto-serialize a Python dict
for a JSONB bind parameter. Serialization happens one layer up, in
ProviderActivityLogService.
"""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_activity_log_repository import (
    ProviderActivityLogRepositoryPort,
)

_LIMIT_CAP = 100


class ProviderActivityLogSqlAdapter(ProviderActivityLogRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def record(
        self,
        provider_id: str,
        *,
        action: str,
        entity_type: str | None,
        entity_id: str | None,
        metadata: str | None,
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.ACTIVITY_LOG.RECORD",
            {
                "provider_id": provider_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "metadata": metadata,
            },
        )
        return rows[0] if rows else None

    async def list_entries(
        self,
        provider_id: str,
        *,
        action_prefix: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.ACTIVITY_LOG.LIST",
            {
                "user_id": provider_id,
                "action_prefix": action_prefix,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )
