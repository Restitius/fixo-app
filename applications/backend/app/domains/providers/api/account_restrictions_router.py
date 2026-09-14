"""Provider account restrictions & status router - Phase 53.

Prefix: /providers/me/account-status

Read-only: imposing/lifting a restriction is a platform/admin action
(ProviderAccountRestrictionsService.impose()/.lift()), not exposed here.
"""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/account-status", tags=["provider-account-status"])


@router.get("/")
async def status_summary(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_account_restrictions_service()
    return ok(await svc.status_summary(str(provider["provider_id"])))


@router.get("/history")
async def restriction_history(
    provider: CurrentProvider,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_account_restrictions_service()
    return ok(await svc.history(str(provider["provider_id"]), limit=limit, offset=offset))
