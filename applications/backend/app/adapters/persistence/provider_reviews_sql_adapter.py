
from __future__ import annotations
from typing import Any

from app.ports.persistence.provider_reviews_repository import ProviderReviewsRepository


class ProviderReviewsSqlAdapter(ProviderReviewsRepository):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        min_rating: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]:
        return await self._queries.execute(
            "PROV.REVIEWS.LIST",
            {
                "user_id": provider_id,
                "status": status,
                "min_rating": min_rating,
                "limit": limit,
                "offset": offset,
            },
        )

    async def detail(self, provider_id: str, *, review_id: str) -> Any | None:
        rows = await self._queries.execute(
            "PROV.REVIEWS.DETAIL",
            {"user_id": provider_id, "review_id": review_id},
        )
        return rows[0] if rows else None

    async def summary(self, provider_id: str) -> Any:
        rows = await self._queries.execute(
            "PROV.REVIEWS.SUMMARY",
            {"user_id": provider_id},
        )
        return rows[0] if rows else None