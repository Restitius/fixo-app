"""Maintenance domain router - Phase 11, Module 33."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


class PlanCreate(BaseModel):
    asset_id: str
    service_id: str
    interval_days: int = Field(default=180, ge=1, le=1095)
    next_due_date: date | None = None
    notes: str | None = Field(default=None, max_length=300)


@router.post("/plans", status_code=201)
async def create_plan(payload: PlanCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().maintenance_service()
    data = payload.model_dump()
    if data["next_due_date"]:
        data["next_due_date"] = data["next_due_date"].isoformat()
    return ok(await svc.create_plan(str(customer["customer_id"]), data),
              title="Maintenance plan created", status_code=201)


@router.get("/plans")
async def list_plans(
    customer: CurrentCustomer,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
) -> dict:
    svc = get_composition().maintenance_service()
    return ok(await svc.list_plans(str(customer["customer_id"]), page, limit))


@router.get("/plans/{plan_id}")
async def get_plan(plan_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().maintenance_service()
    return ok(await svc.get_plan(str(customer["customer_id"]), plan_id))


@router.post("/plans/{plan_id}/done")
async def mark_done(plan_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().maintenance_service()
    return ok(await svc.mark_done(str(customer["customer_id"]), plan_id),
              title="Service marked done")


@router.delete("/plans/{plan_id}")
async def cancel_plan(plan_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().maintenance_service()
    await svc.cancel(str(customer["customer_id"]), plan_id)
    return ok({"cancelled": True}, title="Plan cancelled")
