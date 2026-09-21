"""Provider Arrival API router (Requirement Phase 19)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps.provider_auth import CurrentProvider
from app.domains.providers.services.provider_arrival_service import ProviderArrivalService
from app.shared.responses.envelope import success_envelope
from app.startup.composition import get_composition

router = APIRouter(tags=["provider-arrival"])


def _service() -> ProviderArrivalService:
    return get_composition().provider_arrival_service()


@router.post("/providers/me/bookings/{booking_id}/arrive")
async def arrive(
    booking_id: str,
    latitude: float,
    longitude: float,
    provider: CurrentProvider,
    svc: ProviderArrivalService = Depends(_service),
) -> dict:
    """Record provider arrival with GPS (Requirement Phase 19)."""
    result = await svc.arrive(provider["provider_id"], booking_id, latitude, longitude)
    return success_envelope(result, title="Provider arrived")


@router.post("/providers/me/bookings/{booking_id}/verify-pin")
async def verify_pin(
    booking_id: str,
    code: str,
    provider: CurrentProvider,
    svc: ProviderArrivalService = Depends(_service),
) -> dict:
    """Verify the customer's job PIN (Requirement Phase 19)."""
    result = await svc.verify_pin(provider["provider_id"], booking_id, code)
    return success_envelope(result, title="PIN verified — work can begin")


@router.get("/providers/me/bookings/{booking_id}/arrival-status")
async def arrival_status(
    booking_id: str,
    provider: CurrentProvider,
    svc: ProviderArrivalService = Depends(_service),
) -> dict:
    """Get arrival state for a booking (Requirement Phase 19)."""
    result = await svc.status(provider["provider_id"], booking_id)
    return success_envelope(result or {}, title="Arrival status")
