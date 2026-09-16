"""Provider Tracking — API routes (Phase 18).

Provider trip lifecycle: start → stream location → end.
Provider reads customer address for navigation; customer reads live position.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps.auth import CurrentCustomer
from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_tracking_service import ProviderTrackingService
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/tracking", tags=["provider-tracking"])


def _service() -> ProviderTrackingService:
    return get_composition().provider_tracking_service()


@router.post("/bookings/{booking_id}/start-trip")
async def start_trip(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
    svc: ProviderTrackingService = Depends(_service),
) -> dict:
    result = await svc.start_trip(str(provider["provider_id"]), booking_id)
    return ok(result)


@router.put("/bookings/{booking_id}/location")
async def update_location(
    booking_id: str,
    latitude: float,
    longitude: float,
    eta_minutes: int | None = None,
    provider: dict = Depends(get_current_provider),
    svc: ProviderTrackingService = Depends(_service),
) -> dict:
    result = await svc.update_location(
        str(provider["provider_id"]), booking_id, latitude, longitude, eta_minutes
    )
    return ok(result)


@router.post("/bookings/{booking_id}/record-location")
async def record_location(
    booking_id: str,
    latitude: float,
    longitude: float,
    provider: dict = Depends(get_current_provider),
    svc: ProviderTrackingService = Depends(_service),
) -> dict:
    result = await svc.record_location(str(provider["provider_id"]), booking_id, latitude, longitude)
    return ok(result)


@router.post("/bookings/{booking_id}/end-trip")
async def end_trip(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
    svc: ProviderTrackingService = Depends(_service),
) -> dict:
    result = await svc.end_trip(str(provider["provider_id"]), booking_id)
    return ok(result)


@router.get("/bookings/{booking_id}/nav-info")
async def get_nav_info(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
    svc: ProviderTrackingService = Depends(_service),
) -> dict:
    result = await svc.get_nav_info(str(provider["provider_id"]), booking_id)
    return ok(result)


@router.get("/bookings/{booking_id}/location")
async def get_location(
    booking_id: str,
    customer: CurrentCustomer,
    svc: ProviderTrackingService = Depends(_service),
) -> dict:
    """Customer views provider's live position (status must be ON_THE_WAY)."""
    result = await svc.get_location(booking_id, customer_id=str(customer["customer_id"]))
    return ok(result)
