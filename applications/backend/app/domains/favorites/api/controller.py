"""FavoriteController — THIN translation layer for the favorites domain.

Responsibilities: receive request → context → service → response.
It NEVER writes SQL, sends emails, or publishes events directly.
"""
from __future__ import annotations

from app.api.deps.request_context import RequestContext
from app.domains.favorites.services.favorite_service import FavoriteService
from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class FavoriteController:
    _service: FavoriteService | None = None

    @classmethod
    def _get_service(cls) -> FavoriteService:
        if cls._service is None:
            try:
                from app.startup.composition import get_composition
                cls._service = get_composition().favorite_service()
            except RuntimeError:
                raise NotImplementedFeatureError("FavoriteService not composed yet — run startup first")
        return cls._service

    @classmethod
    async def toggle(cls, ctx: RequestContext, provider_id: str) -> dict:
        cls._get_service()
        result = await cls._get_service().toggle_favorite(ctx.customer_id, provider_id)
        return {"success": True, "data": result}

    @classmethod
    async def my_favorites(cls, ctx: RequestContext) -> dict:
        cls._get_service()
        items = await cls._get_service().my_favorites(ctx.customer_id)
        return {"success": True, "data": items}
