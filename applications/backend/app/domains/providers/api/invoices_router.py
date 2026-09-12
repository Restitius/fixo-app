"""Provider invoices & statements router (Requirement Phase 32).

Prefix: /providers/me/invoices

- GET /        — list invoices (paginated, newest period first)
- GET /summary — totals + overdue count
- GET /{invoice_id} — single invoice
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_invoices_service import (
    ProviderInvoicesService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/invoices", tags=["provider-invoices"])


def _service() -> ProviderInvoicesService:
    return get_composition().provider_invoices_service()


@router.get("/")
async def list_invoices(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    provider: dict = Depends(get_current_provider),
) -> list[Any]:
    """List provider invoices, newest period first."""
    svc = _service()
    return await svc.list_invoices(
        provider_id=str(provider["provider_id"]), limit=limit, offset=offset
    )


@router.get("/summary")
async def get_summary(
    provider: dict = Depends(get_current_provider),
) -> Any:
    """Return provider invoice totals and overdue count."""
    svc = _service()
    return await svc.get_summary(provider_id=str(provider["provider_id"]))


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    provider: dict = Depends(get_current_provider),
) -> Any:
    """Return a single invoice by id (ownership-checked)."""
    svc = _service()
    return await svc.get_invoice(
        provider_id=str(provider["provider_id"]), invoice_id=invoice_id
    )