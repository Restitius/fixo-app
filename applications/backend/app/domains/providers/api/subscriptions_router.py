"""Provider subscription / plans router - Phase 52.

Prefix: /providers/me/subscription
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/subscription", tags=["provider-subscription"])


class SubscribeRequest(BaseModel):
    plan_id: str


@router.get("/plans")
async def list_plans(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_subscriptions_service()
    return ok(await svc.list_plans())


@router.get("/")
async def current_subscription(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_subscriptions_service()
    return ok(await svc.current(str(provider["provider_id"])))


@router.post("/subscribe", status_code=201)
async def subscribe(payload: SubscribeRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_subscriptions_service()
    record = await svc.subscribe(str(provider["provider_id"]), plan_id=payload.plan_id)
    return ok(record, title="Subscribed", status_code=201)


@router.post("/cancel")
async def cancel_subscription(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_subscriptions_service()
    result = await svc.cancel(str(provider["provider_id"]))
    return ok(result, title="Subscription cancelled")


@router.get("/history")
async def subscription_history(
    provider: CurrentProvider,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_subscriptions_service()
    return ok(await svc.history(str(provider["provider_id"]), limit=limit, offset=offset))
