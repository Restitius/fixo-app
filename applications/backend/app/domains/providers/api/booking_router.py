"""Provider Booking Confirmation — API routes (Phase 14)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_booking_service import ProviderBookingService
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/bookings", tags=["provider-bookings"])


def _service() -> ProviderBookingService:
    return get_composition().provider_booking_service()


@router.get("")
async def feed(
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.feed(
        provider_id=str(provider["provider_id"]),
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/{booking_id}")
async def get(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.get(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
    )


@router.post("/{booking_id}/acknowledge")
async def acknowledge(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.acknowledge(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
    )


@router.get("/{booking_id}/acknowledgement")
async def ack_status(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.ack_status(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
    )
