"""ProviderAccountRestrictionsSqlAdapter - the only layer that knows the PROV.ACCOUNT_RESTRICTIONS.* IDs."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from app.ports.persistence.provider_account_restrictions_repository import (
    ProviderAccountRestrictionsRepositoryPort,
)

_LIMIT_CAP = 100


class ProviderAccountRestrictionsSqlAdapter(ProviderAccountRestrictionsRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def impose(
        self,
        provider_id: str,
        *,
        restriction_type: str,
        reason: str,
        expires_at: datetime | None,
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.ACCOUNT_RESTRICTIONS.IMPOSE",
            {
                "provider_id": provider_id,
                "restriction_type": restriction_type,
                "reason": reason,
                "expires_at": expires_at,
            },
        )
        return rows[0] if rows else None

    async def lift(
        self, restriction_id: str, *, lifted_reason: str | None
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.ACCOUNT_RESTRICTIONS.LIFT",
            {"restriction_id": restriction_id, "lifted_reason": lifted_reason},
        )
        return rows[0] if rows else None

    async def list_active(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.ACCOUNT_RESTRICTIONS.LIST_ACTIVE", {"user_id": provider_id}
        )

    async def history(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.ACCOUNT_RESTRICTIONS.HISTORY",
            {
                "user_id": provider_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )
