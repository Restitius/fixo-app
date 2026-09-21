"""Provider Booking Confirmation — API routes (Phases 14, 16, 20).

Every other provider router wraps its responses in the standard
{success, data, message} envelope via app.api.responses.response.ok() —
this one didn't (returned raw service results), which is incompatible
with every real API client in this codebase (web-provider's, web-user's
and the mobile app's api-client.ts all check `json.success` and unwrap
`json.data`). Found via live end-to-end testing while wiring
web-provider's bookings.tsx to this router; fixed by wrapping every
endpoint the same way the rest of the app already does.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_booking_service import ProviderBookingService
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/bookings", tags=["provider-bookings"])


def _service() -> ProviderBookingService:
    return get_composition().provider_booking_service()


class StartServiceBody(BaseModel):
    gps_lat: float | None = None
    gps_lng: float | None = None


@router.get("")
async def feed(
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.feed(
            provider_id=str(provider["provider_id"]),
            status=status,
            limit=limit,
            offset=offset,
        )
    )


@router.get("/{booking_id}")
async def get(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.get(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )


@router.post("/{booking_id}/acknowledge")
async def acknowledge(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.acknowledge(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )


@router.get("/{booking_id}/acknowledgement")
async def ack_status(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.ack_status(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )


@router.get("/{booking_id}/details")
async def details(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.details(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )


@router.get("/{booking_id}/timeline")
async def timeline(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.timeline(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )


@router.get("/{booking_id}/messages/count")
async def message_count(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.message_count(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )


@router.post("/{booking_id}/start")
async def start_service(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
    body: StartServiceBody | None = None,
):
    svc = _service()
    return ok(
        await svc.start_service(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
            gps_lat=(body.gps_lat if body else None),
            gps_lng=(body.gps_lng if body else None),
        )
    )


@router.get("/{booking_id}/start-status")
async def start_status(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.start_status(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )
