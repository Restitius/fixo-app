"""ProviderPortfolioSqlAdapter — SQL-backed implementation of ProviderPortfolioRepository.

Routes operations through governed queries:
- PROV.PORTFOLIO.LIST   — provider portfolio listing
- PROV.PORTFOLIO.GET    — single item fetch (ownership-scoped)
- PROV.PORTFOLIO.ADD    — create item
- PROV.PORTFOLIO.UPDATE — modify item (ownership-scoped)
- PROV.PORTFOLIO.DELETE — remove item (ownership-scoped)
"""

from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_portfolio_repository import ProviderPortfolioRepository


class ProviderPortfolioSqlAdapter(ProviderPortfolioRepository):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]:
        """List provider portfolio items, newest first."""
        return await self._queries.execute(
            "PROV.PORTFOLIO.LIST",
            {
                "provider_id": provider_id,
                "status": status,
                "limit": limit,
                "offset": offset,
            },
        )

    async def get(self, provider_id: str, *, portfolio_id: str) -> Any | None:
        """Fetch a single portfolio item by id (ownership-scoped)."""
        rows = await self._queries.execute(
            "PROV.PORTFOLIO.GET",
            {"provider_id": provider_id, "portfolio_id": portfolio_id},
        )
        return rows[0] if rows else None

    async def add(self, provider_id: str, **fields: Any) -> Any:
        """Create a new portfolio item for the provider."""
        rows = await self._queries.execute(
            "PROV.PORTFOLIO.ADD",
            {"provider_id": provider_id, **fields},
        )
        return rows[0] if rows else None

    async def update(self, provider_id: str, *, portfolio_id: str, **fields: Any) -> Any | None:
        """Update an existing portfolio item (ownership-scoped)."""
        rows = await self._queries.execute(
            "PROV.PORTFOLIO.UPDATE",
            {"provider_id": provider_id, "portfolio_id": portfolio_id, **fields},
        )
        return rows[0] if rows else None

    async def delete(self, provider_id: str, *, portfolio_id: str) -> Any | None:
        """Remove a portfolio item (ownership-scoped)."""
        rows = await self._queries.execute(
            "PROV.PORTFOLIO.DELETE",
            {"provider_id": provider_id, "portfolio_id": portfolio_id},
        )
        return rows[0] if rows else None