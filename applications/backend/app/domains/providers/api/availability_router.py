"""Provider availability routes — working hours & availability (Provider Req Phase 9).

The weekly recurring schedule (one window per day), the ONLINE/OFFLINE
toggle with emergency/same-day/holiday availability, vacation mode and
temporary unavailable periods. Only available providers receive immediate
jobs — the matching engine (Phase 12) consumes ``GET /summary``.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Path
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/availability", tags=["provider-availability"])


class AvailabilitySettingsRequest(BaseModel):
    """Availability toggles + vacation window (full replace)."""

    is_online: bool = False
    accepts_emergency: bool = False
    accepts_same_day: bool = False
    accepts_holidays: bool = False
    vacation_mode: bool = False
    vacation_from: str | None = None
    vacation_until: str | None = None
    timezone: str = Field(default="UTC", max_length=60)
    notes: str | None = Field(default=None, max_length=500)


class WorkingHoursRequest(BaseModel):
    """One day's recurring window; is_available=False marks the day closed."""

    is_available: bool = True
    start_time: str | None = Field(default=None, max_length=8)
    end_time: str | None = Field(default=None, max_length=8)


class TimeOffRequest(BaseModel):
    """A temporary unavailable period (ISO datetimes)."""

    reason: str | None = Field(default=None, max_length=200)
    starts_at: str = Field(max_length=32)
    ends_at: str = Field(max_length=32)


def _service() -> Any:
    return get_composition().provider_availability_service()


@router.get("/settings")
async def get_settings(provider: CurrentProvider) -> Any:
    """The provider's availability settings (404 until configured)."""
    return ok(await _service().get_settings(str(provider["provider_id"])))


@router.put("/settings")
async def save_settings(payload: AvailabilitySettingsRequest, provider: CurrentProvider) -> Any:
    """Create or replace the availability toggles + vacation window."""
    return ok(
        await _service().save_settings(str(provider["provider_id"]), payload.model_dump(exclude_unset=True))
    )


@router.get("/hours")
async def list_hours(provider: CurrentProvider) -> Any:
    """The weekly recurring schedule (0=Monday .. 6=Sunday)."""
    return ok(await _service().list_hours(str(provider["provider_id"])))


DayOfWeek = Annotated[int, Path(ge=0, le=6, description="0=Monday .. 6=Sunday")]


@router.put("/hours/{day_of_week}")
async def set_day(
    day_of_week: DayOfWeek,
    payload: WorkingHoursRequest,
    provider: CurrentProvider,
) -> Any:
    """Upsert one day's working window (e.g. Monday 08:00-18:00)."""
    return ok(
        await _service().set_day(
            str(provider["provider_id"]),
            day_of_week,
            payload.model_dump(exclude_unset=True),
        )
    )


@router.delete("/hours/{day_of_week}")
async def clear_day(day_of_week: DayOfWeek, provider: CurrentProvider) -> Any:
    """Reset one day's working window (day becomes unset/unavailable)."""
    return ok(await _service().clear_day(str(provider["provider_id"]), day_of_week))


@router.get("/time-off")
async def list_time_off(provider: CurrentProvider) -> Any:
    """Temporary unavailable periods."""
    return ok(await _service().list_time_off(str(provider["provider_id"])))


@router.post("/time-off")
async def add_time_off(payload: TimeOffRequest, provider: CurrentProvider) -> Any:
    """Declare a temporary unavailable period (vacation, closure, ...)."""
    return ok(
        await _service().add_time_off(str(provider["provider_id"]), payload.model_dump(exclude_unset=True))
    )


@router.delete("/time-off/{time_off_id}")
async def remove_time_off(time_off_id: str, provider: CurrentProvider) -> Any:
    """Remove one unavailable period."""
    return ok(await _service().remove_time_off(str(provider["provider_id"]), time_off_id))


@router.get("/summary")
async def availability_summary(provider: CurrentProvider) -> Any:
    """Effective availability snapshot (dashboard/matching input)."""
    return ok(await _service().summary(str(provider["provider_id"])))
