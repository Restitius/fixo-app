"""ProviderAccountClosureSqlAdapter - mirrors AccountClosureSqlAdapter for providers."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_account_closure_repository import (
    ProviderAccountClosureRepositoryPort,
)


class ProviderAccountClosureSqlAdapter(ProviderAccountClosureRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def schedule_closure(self, provider_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.ACCOUNT.CLOSURE.SCHEDULE", {"user_id": provider_id}
        )
        return rows[0] if rows else None
