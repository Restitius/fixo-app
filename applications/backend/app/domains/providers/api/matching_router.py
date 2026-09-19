"""Provider matching routes — eligibility + match insights (Provider Req Phase 12).

The provider-side window into the marketplace matching engine: how the
engine sees my signals (eligibility) and why I was matched for each request
(insights), plus summary counts. Read-only.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/matching", tags=["provider-matching"])


def _service() -> Any:
    return get_composition().provider_matching_service()


@router.get("")
async def eligibility(provider: CurrentProvider) -> Any:
    """How the matching engine sees the provider's signals today."""
    return ok(await _service().eligibility(str(provider["provider_id"])))


@router.get("/insights")
async def insights(provider: CurrentProvider) -> Any:
    """Every matched request with score/rank/strategy/reasons + outcome."""
    return ok(await _service().insights(str(provider["provider_id"])))


@router.get("/summary")
async def summary(provider: CurrentProvider) -> Any:
    """Match-opportunity counts (pending/quoted/accepted/selected)."""
    return ok(await _service().summary(str(provider["provider_id"])))