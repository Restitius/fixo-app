"""Provider commission & fees router (Phase 31).

Prefix: /providers/me/commission

- GET  /rate            current commission + tax rate for the provider
- POST /apply           apply a commission/fee event (gross -> commission -> tax -> net)
- GET  /fees            provider commission/fee history
- GET  /fees/summary    provider commission/fee totals
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_commission_service import (
    ProviderCommissionService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/commission", tags=["provider-commission"])


def _service() -> ProviderCommissionService:
    return get_composition().provider_commission_service()


class CommissionApplyBody(BaseModel):
    gross_amount: float = Field(..., gt=0)
    currency: str = Field("TZS", min_length=3, max_length=3)
    commission_rate: float | None = Field(None, ge=0, le=1)
    tax_on_commission: float | None = Field(None, ge=0, le=1)
    reference_type: str | None = Field(None, max_length=40)
    reference_id: str | None = Field(None)
    description: str | None = Field(None, max_length=300)


@router.get("/rate")
async def current_rate(
    currency: str = "TZS",
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    return await _service().current_rate(
        provider_id=str(provider["provider_id"]),
        currency=currency,
    )


@router.post("/apply", status_code=201)
async def apply_fee(
    body: CommissionApplyBody,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    return await _service().apply(
        provider_id=str(provider["provider_id"]),
        currency=body.currency,
        gross_amount=body.gross_amount,
        commission_rate=body.commission_rate,
        tax_on_commission=body.tax_on_commission,
        reference_type=body.reference_type,
        reference_id=body.reference_id,
        description=body.description,
    )


@router.get("/fees")
async def list_fees(
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    return await _service().list_fees(
        provider_id=str(provider["provider_id"]),
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/fees/summary")
async def fee_summary(
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    return await _service().fee_summary(
        provider_id=str(provider["provider_id"]),
    )
