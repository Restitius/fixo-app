"""WarrantyController — THIN translation layer for the warranties domain.

Responsibilities: receive request → context → service → response.
It NEVER writes SQL, sends emails, or publishes events directly.
"""
from __future__ import annotations
from typing import Any

from app.api.deps.request_context import RequestContext
from app.domains.warranties.services.warranty_service import WarrantyService
from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class WarrantyController:
    _service: WarrantyService | None = None

    @classmethod
    def _get_service(cls) -> WarrantyService:
        if cls._service is None:
            try:
                from app.startup.composition import get_composition
                cls._service = get_composition().warranty_service()
            except RuntimeError:
                raise NotImplementedFeatureError("WarrantyService not composed yet — run startup first")
        return cls._service

    @classmethod
    async def my_warranties(cls, ctx: RequestContext) -> dict:
        cls._get_service()
        items = await cls._get_service().my_warranties(ctx.customer_id)
        return {"success": True, "data": items}

    @classmethod
    async def warranty_detail(cls, ctx: RequestContext, warranty_id: str) -> dict:
        cls._get_service()
        result = await cls._get_service().warranty_detail(ctx.customer_id, warranty_id)
        return {"success": True, "data": result}

    @classmethod
    async def file_claim(cls, ctx: RequestContext, warranty_id: str, payload: Any) -> dict:
        cls._get_service()
        data = payload.model_dump() if hasattr(payload, "model_dump") else dict(payload)
        result = await cls._get_service().file_claim(ctx.customer_id, warranty_id, data)
        return {"success": True, "data": result}
