"""MatchingSqlAdapter — implements MatchingRepository via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class MatchQueryIds:
    SEARCH = "CUS.MATCH.PROVIDERS.SEARCH"
    ADD = "CUS.MATCH.CANDIDATE.ADD"
    LIST = "CUS.MATCH.LIST"


class MatchingSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def search_candidates(
        self, *, service_id: str, customer_id: str,
        city: str | None, region: str | None
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            MatchQueryIds.SEARCH,
            {"service_id": service_id, "customer_id": customer_id,
             "city": city or "", "region": region or ""},
            fetch="all",
        )
        return list(rows or [])

    async def save_candidate(
        self, request_id: str, candidate: dict[str, Any]
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            MatchQueryIds.ADD,
            {
                "request_id": request_id,
                "provider_id": candidate["provider_id"],
                "strategy": candidate["strategy"],
                "score": candidate["score"],
                "rank_pos": candidate["rank_pos"],
                "reasons": candidate.get("reasons"),
            },
            fetch="one",
        )

    async def list_matches(self, customer_id: str, request_id: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            MatchQueryIds.LIST,
            {"customer_id": customer_id, "request_id": request_id},
            fetch="all",
        )
        return list(rows or [])