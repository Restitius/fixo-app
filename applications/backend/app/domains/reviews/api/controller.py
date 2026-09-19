"""ReviewController — THIN translation layer for the reviews domain.

Responsibilities: receive request → context → service → response.
It NEVER writes SQL, sends emails, or publishes events directly.
"""
from __future__ import annotations

from typing import Any

from app.api.deps.request_context import RequestContext
from app.domains.reviews.services.review_service import ReviewService
from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class ReviewController:
    _service: ReviewService | None = None

    @classmethod
    def _get_service(cls) -> ReviewService:
        if cls._service is None:
            try:
                from app.startup.composition import get_composition
                cls._service = get_composition().review_service()
            except RuntimeError:
                raise NotImplementedFeatureError("ReviewService not composed yet — run startup first")
        return cls._service

    @classmethod
    async def create_review(cls, ctx: RequestContext, payload: Any) -> dict:
        cls._get_service()
        data = payload.model_dump() if hasattr(payload, "model_dump") else dict(payload)
        result = await cls._get_service().create_review(ctx.customer_id, data)
        return {"success": True, "data": result}

    @classmethod
    async def my_reviews(cls, ctx: RequestContext) -> dict:
        cls._get_service()
        items = await cls._get_service().my_reviews(ctx.customer_id)
        return {"success": True, "data": items}

    @classmethod
    async def provider_ratings(cls, ctx: RequestContext, service_id: str, provider_id: str) -> dict:
        cls._get_service()
        result = await cls._get_service().service_detail(service_id, provider_id)
        return {"success": True, "data": result}
