"""TransactionQueryService — governed persistence for transactions (no SQL here)."""
from __future__ import annotations

from typing import Any

from app.domains.transactions.queries.query_ids import TransactionQueries
from app.security.ownership import scoped_params


class TransactionQueryService:
    def __init__(self, executor: Any) -> None:
        self._executor = executor

    async def find(self, user_id: str, entity_id: int) -> Any:
        """TRANSACTION.GET_BY_ID (ownership-filtered)."""
        return await self._executor.execute(
            TransactionQueries.GET_BY_ID,
            scoped_params(user_id, {"transaction_id": entity_id}),
            fetch="one",
        )

    async def list(self, filters: dict[str, Any]) -> Any:
        """TRANSACTION.LIST (ownership-filtered, paginated)."""
        return await self._executor.execute(
            TransactionQueries.LIST, scoped_params(filters.pop("user_id"), filters)
        )
