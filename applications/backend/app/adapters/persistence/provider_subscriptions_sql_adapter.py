"""ProviderSubscriptionsSqlAdapter - the only layer that knows the PROV.PLANS.*/PROV.SUBSCRIPTIONS.* IDs."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_subscriptions_repository import (
    ProviderSubscriptionsRepositoryPort,
)

_LIMIT_CAP = 100


class ProviderSubscriptionsSqlAdapter(ProviderSubscriptionsRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list_plans(self) -> list[dict[str, Any]]:
        return await self._queries.execute("PROV.PLANS.LIST", {})

    async def current(self, provider_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SUBSCRIPTIONS.CURRENT", {"user_id": provider_id}
        )
        return rows[0] if rows else None

    async def subscribe(self, provider_id: str, *, plan_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SUBSCRIPTIONS.SUBSCRIBE",
            {"provider_id": provider_id, "plan_id": plan_id},
        )
        return rows[0] if rows else None

    async def cancel(self, provider_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SUBSCRIPTIONS.CANCEL", {"user_id": provider_id}
        )
        return rows[0] if rows else None

    async def history(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.SUBSCRIPTIONS.HISTORY",
            {
                "user_id": provider_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )
