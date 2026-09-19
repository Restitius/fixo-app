"""Favorite SQL adapter - translates business operations into governed SQL query IDs."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.favorite_repository import FavoriteRepositoryPort


class FavoriteSqlAdapter(FavoriteRepositoryPort):
    """The ONLY place where CUS.FAVORITE.* IDs appear."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def toggle(self, customer_id: str, provider_id: str) -> dict[str, Any]:
        row = await self._sql.execute(
            "CUS.FAVORITE.TOGGLE",
            {"customer_id": customer_id, "provider_id": provider_id},
            fetch="one",
        )
        return dict(row) if row else {}

    async def list(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]:
        offset = (page - 1) * limit
        rows = await self._sql.execute(
            "CUS.FAVORITE.LIST",
            {"customer_id": customer_id, "offset": offset, "limit": limit},
            fetch="all",
        )
        return list(rows or [])

