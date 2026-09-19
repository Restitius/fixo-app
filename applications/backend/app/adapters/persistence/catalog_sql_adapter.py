"""CatalogSqlAdapter — implements CatalogRepository via governed queries.

Browsing reads run directly; discovery routes through SearchManager so input
normalisation lives in exactly one place. CUS.CATALOG.* IDs appear here;
CUS.SEARCH.* IDs appear in SearchManager.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.platform.search.search_manager import SearchManager


class CatalogQueryIds:
    CATEGORIES = "CUS.CATALOG.CATEGORIES"
    SERVICE_GET = "CUS.CATALOG.SERVICE.GET"


class CatalogSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager, search: SearchManager) -> None:
        self._sql = sql_manager
        self._search = search

    async def categories(self) -> list[dict[str, Any]]:
        rows = await self._sql.execute(CatalogQueryIds.CATEGORIES, fetch="all")
        return list(rows or [])

    async def service_by_slug(self, slug: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            CatalogQueryIds.SERVICE_GET, {"slug": slug}, fetch="one"
        )
        if isinstance(row, dict) and isinstance(row.get("related_services"), str):
            import json

            row["related_services"] = json.loads(row["related_services"])
        return row

    async def search_services(
        self, term: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._search.search_services(term, limit=limit, offset=offset)

    async def suggestions(self, prefix: str, *, limit: int = 6) -> list[dict[str, Any]]:
        return await self._search.suggestions(prefix, limit=limit)