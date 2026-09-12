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


def _service(
    provider_id: str = Depends(get_current_provider),
) -> ProviderInvoicesService:
    return get_composition().provider_invoices_service(provider_id=provider_id)


@router.get("/")
async def list_invoices(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    svc: ProviderInvoicesService = Depends(_service),
) -> list[Any]:
    """List provider invoices, newest period first."""
    return await svc.list_invoices(limit=limit, offset=offset)


@router.get("/summary")
async def get_summary(
    svc: ProviderInvoicesService = Depends(_service),
) -> Any:
    """Return provider invoice totals and overdue count."""
    return await svc.get_summary()


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    svc: ProviderInvoicesService = Depends(_service),
) -> Any:
    """Return a single invoice by id (ownership-checked)."""
    return await svc.get_invoice(invoice_id=invoice_id)