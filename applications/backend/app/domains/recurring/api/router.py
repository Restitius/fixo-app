"""Recurring domain router - Phase 11, Module 31."""
from __future__ import annotations
from datetime import date

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/recurring", tags=["recurring"])


class RecurringCreate(BaseModel):
    service_id: str
    address_id: str | None = None
    frequency: str = Field(pattern="^(WEEKLY|BIWEEKLY|MONTHLY|QUARTERLY)$")
    next_run_date: date | None = None
    time_window: str | None = Field(default=None, max_length=12)
    instructions: str | None = Field(default=None, max_length=500)


@router.post("", status_code=201)
async def create_subscription(payload: RecurringCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().recurring_service()
    data = payload.model_dump()
    if data["next_run_date"]:
        data["next_run_date"] = data["next_run_date"].isoformat()
    return ok(await svc.create(str(customer["customer_id"]), data),
              title="Subscription created", status_code=201)


@router.get("")
async def list_subscriptions(
    customer: CurrentCustomer,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
) -> dict:
    svc = get_composition().recurring_service()
    return ok(await svc.list(str(customer["customer_id"]), page, limit))


@router.get("/{recurring_id}")
async def get_subscription(recurring_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().recurring_service()
    return ok(await svc.get(str(customer["customer_id"]), recurring_id))


@router.post("/{recurring_id}/pause")
async def pause_subscription(recurring_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().recurring_service()
    return ok(await svc.transition(str(customer["customer_id"]), recurring_id, "PAUSED"),
              title="Subscription paused")


@router.post("/{recurring_id}/resume")
async def resume_subscription(recurring_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().recurring_service()
    return ok(await svc.transition(str(customer["customer_id"]), recurring_id, "ACTIVE"),
              title="Subscription resumed")


@router.delete("/{recurring_id}", status_code=200)
async def cancel_subscription(recurring_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().recurring_service()
    return ok(await svc.transition(str(customer["customer_id"]), recurring_id, "CANCELLED"),
              title="Subscription cancelled")
