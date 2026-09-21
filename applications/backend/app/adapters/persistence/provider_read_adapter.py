"""ProviderReadAdapter — implements ProviderReadPort via governed queries.

This is the ONLY place CUS.PROVIDER.* IDs appear.
"""
from __future__ import annotations

import json
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderQueryIds:
    PROFILE = "CUS.PROVIDER.PROFILE"
    LIST_BY_SERVICE = "CUS.PROVIDER.LIST_BY_SERVICE"
    LIST_BY_CATEGORY = "CUS.PROVIDER.LIST_BY_CATEGORY"


class ProviderReadAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def profile(self, provider_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            ProviderQueryIds.PROFILE,
            {"provider_id": provider_id},
            fetch="one",
        )
        if isinstance(row, dict) and isinstance(row.get("services"), str):
            row["services"] = json.loads(row["services"])
        return row

    async def list_by_service(self, slug: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderQueryIds.LIST_BY_SERVICE,
            {"slug": slug},
            fetch="all",
        )
        return list(rows or [])

    async def list_by_category(self, category_id: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderQueryIds.LIST_BY_CATEGORY,
            {"category_id": category_id},
            fetch="all",
        )
        return list(rows or [])