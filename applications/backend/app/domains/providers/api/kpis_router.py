from typing import Any

from fastapi import APIRouter, Query

from app.shared.runtime.request_context import RequestContext


def make_provider_kpis_router(*, service: Any, ctx: Any) -> APIRouter:
    r = APIRouter(prefix="/providers/me/kpis", tags=["provider-kpis"])

    @r.get("/")
    async def list_kpis(
        ctx: RequestContext = ctx,
        period: str | None = Query(None, pattern="weekly|monthly|quarterly|yearly"),
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
    ) -> list[Any]:
        return await service.list_kpis(ctx.user_id, period=period, limit=limit, offset=offset)

    @r.get("/summary")
    async def get_summary(
        ctx: RequestContext = ctx,
    ) -> Any:
        return await service.get_summary(ctx.user_id)

    return r