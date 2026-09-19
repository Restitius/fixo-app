"""SqlLiabilityRepository — concrete repository over the query service."""
from __future__ import annotations

from typing import Any

from app.domains.liabilities.queries.liability_query_service import LiabilityQueryService


class SqlLiabilityRepository:
    def __init__(self, query_service: LiabilityQueryService) -> None:
        self._queries = query_service

    async def get(self, user_id: str, entity_id: int) -> Any | None:
        return await self._queries.find(user_id, entity_id)

    async def list(self, filters: dict[str, Any]) -> Any:
        return await self._queries.list(filters)
