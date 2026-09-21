"""ServiceAreaSqlAdapter — implements ServiceAreaPort via a governed query."""
from __future__ import annotations

from app.platform.query.sql_query_manager import SQLQueryManager


class ServiceAreaQueryIds:
    CHECK = "CUS.REQUEST.AREA.CHECK"


class ServiceAreaSqlAdapter:
    """ServiceAreaPort implementation — the eligibility engine never sees SQL."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def is_served(self, *, city: str | None, region: str | None) -> bool:
        row = await self._sql.execute(
            ServiceAreaQueryIds.CHECK,
            {"city": city or "", "region": region or ""},
            fetch="one",
        )
        return bool((row or {}).get("served"))