"""Provider activity & audit history router - Phase 51.

Prefix: /providers/me/activity

Read-only: there is no write endpoint, so a provider cannot fabricate
their own audit trail. Entries are recorded internally by other services
(ProviderActivityLogService.record()) after significant actions.
"""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/activity", tags=["provider-activity"])


@router.get("/")
async def list_activity(
    provider: CurrentProvider,
    action_prefix: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_activity_log_service()
    return ok(
        await svc.list_entries(
            str(provider["provider_id"]), action_prefix=action_prefix, limit=limit, offset=offset
        )
    )
