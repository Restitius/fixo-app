"""LiabilityQueryService — governed persistence for liabilities (no SQL here)."""
from __future__ import annotations

from typing import Any

from app.domains.liabilities.queries.query_ids import LiabilityQueries
from app.security.ownership import scoped_params


class LiabilityQueryService:
    def __init__(self, executor: Any) -> None:
        self._executor = executor

    async def find(self, user_id: str, entity_id: int) -> Any:
        """LIABILITY.GET_BY_ID (ownership-filtered)."""
        return await self._executor.execute(
            LiabilityQueries.GET_BY_ID,
            scoped_params(user_id, {"liability_id": entity_id}),
            fetch="one",
        )

    async def list(self, filters: dict[str, Any]) -> Any:
        """LIABILITY.LIST (ownership-filtered, paginated)."""
        return await self._executor.execute(
            LiabilityQueries.LIST, scoped_params(filters.pop("user_id"), filters)
        )
