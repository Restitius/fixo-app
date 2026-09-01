"""Internal integration channel — provider-side booking events.

Protected by X-Internal-Key; this is the contract a future provider backend
(or worker) calls instead of touching domain tables directly.
"""
from __future__ import annotations

from fastapi import APIRouter, Header
from pydantic import BaseModel

from app.api.responses.response import ok
from app.shared.exceptions.hierarchy import AuthenticationError
from app.startup.composition import get_composition

router = APIRouter(prefix="/internal", tags=["internal"])


class ProviderEvent(BaseModel):
    event: str                      # ON_THE_WAY | ARRIVED (Phase 8 adds more)
    latitude: float | None = None
    longitude: float | None = None


def _require_internal_key(x_internal_key: str | None) -> None:
    from app.config import get_settings

    if not x_internal_key or x_internal_key != get_settings().internal_api_key:
        raise AuthenticationError("Invalid internal key")


@router.post("/bookings/{booking_id}/provider-events")
async def provider_event(
    booking_id: str,
    payload: ProviderEvent,
    x_internal_key: str | None = Header(default=None),
) -> dict:
    _require_internal_key(x_internal_key)
    svc = get_composition().tracking_service()
    result = await svc.apply_provider_event(
        booking_id, payload.event,
        latitude=payload.latitude, longitude=payload.longitude,
    )
    return ok(result, title=f"Provider event {payload.event}")


@router.post("/scheduler/tick")
async def scheduler_tick(x_internal_key: str | None = Header(default=None)) -> dict:
    """Force one scheduler pass (deterministic trigger for tests/ops)."""
    _require_internal_key(x_internal_key)
    composition = get_composition()
    if composition.scheduler is None:
        return ok({"error": "scheduler not started"}, title="Scheduler")
    results = await composition.scheduler.run_due()
    return ok(results, title="Scheduler tick complete")