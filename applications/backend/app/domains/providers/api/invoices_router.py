from typing import Any

from fastapi import APIRouter, Query

from app.shared.runtime.request_context import RequestContext


def make_provider_invoices_router(*, service: Any, ctx: Any) -> APIRouter:
    r = APIRouter(prefix="/providers/me/invoices", tags=["provider-invoices"])

    @r.get("/")
    async def list_invoices(
        ctx: RequestContext = ctx,
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
    ) -> list[Any]:
        return await service.list_invoices(ctx.user_id, limit=limit, offset=offset)

    @r.get("/summary")
    async def get_summary(
        ctx: RequestContext = ctx,
    ) -> Any:
        return await service.get_summary(ctx.user_id)

    @r.get("/{invoice_id}")
    async def get_invoice(
        invoice_id: str,
        ctx: RequestContext = ctx,
    ) -> Any:
        return await service.get_invoice(ctx.user_id, invoice_id=invoice_id)

    return r