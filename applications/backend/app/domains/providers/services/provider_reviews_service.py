from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError


class ProviderReviewsService:
    def __init__(self, reviews: Any) -> None:
        self._reviews = reviews

    async def list_reviews(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        min_rating: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]:
        return await self._reviews.list(
            provider_id,
            status=status,
            min_rating=min_rating,
            limit=limit,
            offset=offset,
        )

    async def get_review(self, provider_id: str, *, review_id: str) -> Any:
        row = await self._reviews.detail(provider_id, review_id=review_id)
        if not row:
            raise NotFoundError("review not found")
        return row

    async def get_summary(self, provider_id: str) -> Any:
        return await self._reviews.summary(provider_id)