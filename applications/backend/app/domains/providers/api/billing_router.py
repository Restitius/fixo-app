"""Provider final billing router (Phase 27).

Prefix: /providers/me/billing

- GET /bookings/{booking_id}  final-bill preview (read-only breakdown;
  bill_ready=true only after CUSTOMER_CONFIRMED sign-off)
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_billing_service import (
    ProviderBillingService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/billing", tags=["provider-billing"])


def _service() -> ProviderBillingService:
    return get_composition().provider_billing_service()


@router.get("/bookings/{booking_id}")
async def preview_bill(
    booking_id: str,
    tax_rate: float | None = None,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    svc = _service()
    return await svc.preview(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
        tax_rate=tax_rate,
    )
