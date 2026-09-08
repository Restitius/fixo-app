"""Provider pricing routes — five pricing structures per service (Provider Req Phase 7).

One structured pricing row per configured service:
FIXED | STARTING | HOURLY | INSPECTION_THEN_QUOTE | CUSTOM_QUOTATION.
The platform admin module wires approval; these are provider-owned endpoints.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/pricing", tags=["provider-pricing"])


class UpsertPricingRequest(BaseModel):
    """Full replace of one service's pricing (required fields depend on the model)."""

    pricing_model: str = Field(max_length=30)
    base_amount: float | None = None
    from_amount: float | None = None
    hourly_rate: float | None = None
    minimum_hours: float | None = None
    inspection_fee: float | None = None
    currency: str = Field(default="TZS", max_length=3)
    includes_text: str | None = Field(default=None, max_length=500)
    is_negotiable: bool = False


def _service() -> Any:
    return get_composition().provider_pricing_service()


@router.get("")
async def list_pricing(provider: CurrentProvider) -> Any:
    """Structured pricing for all of the provider's configured services."""
    return ok(await _service().list_pricing(str(provider["provider_id"])))


@router.get("/{service_id}")
async def get_pricing(service_id: str, provider: CurrentProvider) -> Any:
    """One service's structured pricing (owner view)."""
    return ok(await _service().get_pricing(str(provider["provider_id"]), service_id))


@router.put("/{service_id}")
async def upsert_pricing(
    service_id: str, payload: UpsertPricingRequest, provider: CurrentProvider
) -> Any:
    """Set/replace one service's pricing; re-syncs the parent configuration."""
    data = payload.model_dump(exclude_unset=True)
    return ok(
        await _service().upsert_pricing(str(provider["provider_id"]), service_id, data)
    )


@router.delete("/{service_id}")
async def clear_pricing(service_id: str, provider: CurrentProvider) -> Any:
    """Remove one service's pricing; the configuration resets to quote-based."""
    return ok(await _service().clear_pricing(str(provider["provider_id"]), service_id))
