"""Provider dashboard routes — attention, stats, quick actions (Provider Req Phase 10).

Read-only: the main overview payload answers "what requires my attention
today?" and carries the four primary statistics; /schedule, /earnings and
/performance expose the requirement's remaining dashboard sections.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/dashboard", tags=["provider-dashboard"])


def _service() -> Any:
    return get_composition().provider_dashboard_service()


@router.get("")
async def overview(provider: CurrentProvider) -> Any:
    """Main dashboard: stats, setup state, attention items, quick actions."""
    return ok(await _service().overview(str(provider["provider_id"])))


@router.get("/schedule")
async def schedule(provider: CurrentProvider) -> Any:
    """Today's jobs plus the upcoming 7 days."""
    return ok(await _service().schedule(str(provider["provider_id"])))


@router.get("/earnings")
async def earnings(provider: CurrentProvider) -> Any:
    """Earnings snapshot: collected today/week/month plus billed this month."""
    return ok(await _service().earnings(str(provider["provider_id"])))


@router.get("/performance")
async def performance(provider: CurrentProvider) -> Any:
    """Completion/cancellation rates; acceptance + response time arrive with Phase 11."""
    return ok(await _service().performance(str(provider["provider_id"])))