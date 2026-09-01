"""PublicContentSqlAdapter — public, unauthenticated reads via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class PublicQueryIds:
    CONTENT = "CUS.PUBLIC.CONTENT"
    CATEGORIES = "CUS.PUBLIC.CATEGORIES"
    SERVICES = "CUS.PUBLIC.SERVICES.BY_CATEGORY"
    SEARCH = "CUS.PUBLIC.SERVICES.SEARCH"
    FAQS = "CUS.PUBLIC.FAQS"


class PublicContentSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def content_blocks(self) -> list[dict[str, Any]]:
        return await self._sql.execute(PublicQueryIds.CONTENT) or []

    async def categories(self) -> list[dict[str, Any]]:
        return await self._sql.execute(PublicQueryIds.CATEGORIES) or []

    async def services(self, category_code: str | None) -> list[dict[str, Any]]:
        return (
            await self._sql.execute(
                PublicQueryIds.SERVICES, {"category_code": category_code}
            )
            or []
        )

    async def search_services(self, term: str) -> list[dict[str, Any]]:
        return (
            await self._sql.execute(PublicQueryIds.SEARCH, {"term": f"%{term}%"}) or []
        )

    async def faqs(self) -> list[dict[str, Any]]:
        return await self._sql.execute(PublicQueryIds.FAQS) or []