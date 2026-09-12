from typing import Any

from fastapi import APIRouter, Query

from app.shared.runtime.request_context import RequestContext


def make_provider_ratings_router(*, service: Any, ctx: Any) -> APIRouter:
    r = APIRouter(prefix="/providers/me/ratings", tags=["provider-ratings"])

    @r.get("/")
    async def list_reviews(
        ctx: RequestContext = ctx,
        status: str | None = Query(None, pattern="published|all"),
        min_rating: int | None = Query(None, ge=1, le=5),
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
    ) -> list[Any]:
        return await service.list_reviews(
            ctx.user_id,
            status=status,
            min_rating=min_rating,
            limit=limit,
            offset=offset,
        )

    @r.get("/summary")
    async def get_summary(
        ctx: RequestContext = ctx,
    ) -> Any:
        return await service.get_summary(ctx.user_id)

    @r.get("/{review_id}")
    async def get_review(
        review_id: str,
        ctx: RequestContext = ctx,
    ) -> Any:
        return await service.get_review(ctx.user_id, review_id=review_id)

    return r