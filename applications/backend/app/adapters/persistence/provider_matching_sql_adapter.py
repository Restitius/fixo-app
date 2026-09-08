"""ProviderMatchingSqlAdapter — implements ProviderMatchingRepository.

This is the ONLY place PRV.MATCH.* query IDs appear. Read-only aggregation
over the marketplace matching tables plus the provider Phases 5-11 state.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderMatchingQueryIds:
    ELIGIBILITY = "PRV.MATCH.ELIGIBILITY"
    INSIGHTS = "PRV.MATCH.INSIGHTS"
    SUMMARY = "PRV.MATCH.SUMMARY"


class ProviderMatchingSqlAdapter:
    """Implements ProviderMatchingRepository over the governed PRV.MATCH.* reads."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def eligibility(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderMatchingQueryIds.ELIGIBILITY,
            {"user_id": provider_id},
            fetch="one",
        )

    async def insights(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderMatchingQueryIds.INSIGHTS, {"user_id": provider_id}
        ) or []

    async def summary(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderMatchingQueryIds.SUMMARY, {"user_id": provider_id}, fetch="one"
        )