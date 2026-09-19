"""SearchManager — search execution facade over governed search queries.

Sits BELOW adapters (platform layer): normalises user input once, then runs
the registered SEARCH queries through SQLQueryManager. Application services
never see this class; they use the CatalogRepository port instead.
"""
from __future__ import annotations

import re
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class SearchQueryIds:
    SERVICES = "CUS.SEARCH.SERVICES"
    SUGGESTIONS = "CUS.SEARCH.SUGGESTIONS"


class SearchManager:
    """Normalise → execute → shape for the two governed search reads."""

    MAX_TERM_LEN = 60
    _WS = re.compile(r"\s+")

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    @classmethod
    def normalize(cls, term: str) -> str:
        """Collapse whitespace, trim, cap length. Empty string == no term."""
        cleaned = cls._WS.sub(" ", (term or "").strip())
        return cleaned[: cls.MAX_TERM_LEN]

    async def search_services(
        self,
        term: str,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        clean = self.normalize(term)
        if not clean:
            return []
        rows = await self._sql.execute(
            SearchQueryIds.SERVICES,
            {
                "term": clean,
                "pattern": f"%{clean}%",
                "limit": max(1, min(int(limit), 50)),
                "offset": max(0, int(offset)),
            },
            fetch="all",
        )
        for row in rows or []:
            if isinstance(row.get("score"), float):
                row["score"] = round(row["score"], 4)
        return list(rows or [])

    async def suggestions(self, prefix: str, *, limit: int = 6) -> list[dict[str, Any]]:
        clean = self.normalize(prefix)
        if len(clean) < 2:
            return []
        rows = await self._sql.execute(
            SearchQueryIds.SUGGESTIONS,
            {"prefix": f"{clean}%", "limit": max(1, min(int(limit), 10))},
            fetch="all",
        )
        return list(rows or [])