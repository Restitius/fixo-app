"""Provider Calendar — API routes (Phase 15)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_calendar_service import ProviderCalendarService
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/calendar", tags=["provider-calendar"])


def _service() -> ProviderCalendarService:
    return get_composition().provider_calendar_service()


@router.get("/range")
async def range_view(
    from_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    provider: dict = Depends(get_current_provider),
    svc: ProviderCalendarService = Depends(_service),
) -> dict:
    events = await svc.range(str(provider["provider_id"]), from_date, to_date)
    return ok({"from_date": from_date, "to_date": to_date, "events": events})


@router.get("/day/{date}")
async def day_view(
    date: str,
    provider: dict = Depends(get_current_provider),
    svc: ProviderCalendarService = Depends(_service),
) -> dict:
    events = await svc.day(str(provider["provider_id"]), date)
    return ok({"date": date, "events": events})


@router.get("/week/{date}")
async def week_view(
    date: str,
    provider: dict = Depends(get_current_provider),
    svc: ProviderCalendarService = Depends(_service),
) -> dict:
    return ok(await svc.week(str(provider["provider_id"]), date))


@router.get("/month/{year}/{month}")
async def month_view(
    year: int,
    month: int,
    provider: dict = Depends(get_current_provider),
    svc: ProviderCalendarService = Depends(_service),
) -> dict:
    events = await svc.month(str(provider["provider_id"]), year, month)
    return ok({"year": year, "month": month, "events": events})


@router.get("/agenda")
async def agenda_view(
    from_date: str = Query(..., description="From date (YYYY-MM-DD)"),
    limit: int = Query(20, ge=1, le=100),
    provider: dict = Depends(get_current_provider),
    svc: ProviderCalendarService = Depends(_service),
) -> dict:
    events = await svc.agenda(str(provider["provider_id"]), from_date, limit)
    return ok({"from_date": from_date, "events": events})


@router.get("/overlap-check")
async def overlap_check(
    scheduled_date: str = Query(..., description="Date to check (YYYY-MM-DD)"),
    exclude_booking_id: str | None = Query(None),
    provider: dict = Depends(get_current_provider),
    svc: ProviderCalendarService = Depends(_service),
) -> dict:
    await svc.check_overlap(str(provider["provider_id"]), scheduled_date, exclude_booking_id)
    return ok({"available": True, "scheduled_date": scheduled_date})
