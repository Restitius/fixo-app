"""ProviderDashboardSqlAdapter — implements ProviderDashboardRepository.

This is the ONLY place PRV.DASH.* query IDs appear. Read-only aggregation:
the dashboard owns no tables, so no IntegrityError translation is needed.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderDashboardQueryIds:
    STATS = "PRV.DASH.STATS"
    SETUP = "PRV.DASH.SETUP"
    EARNINGS = "PRV.DASH.EARNINGS"
    PERFORMANCE = "PRV.DASH.PERFORMANCE"
    UPCOMING = "PRV.DASH.UPCOMING"


class ProviderDashboardSqlAdapter:
    """Implements ProviderDashboardRepository over the governed PRV.DASH.* reads."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def stats(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderDashboardQueryIds.STATS, {"user_id": provider_id}, fetch="one"
        )

    async def setup(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderDashboardQueryIds.SETUP, {"user_id": provider_id}, fetch="one"
        )

    async def earnings(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderDashboardQueryIds.EARNINGS, {"user_id": provider_id}, fetch="one"
        )

    async def performance(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderDashboardQueryIds.PERFORMANCE,
            {"user_id": provider_id},
            fetch="one",
        )

    async def upcoming(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderDashboardQueryIds.UPCOMING, {"user_id": provider_id}
        ) or []