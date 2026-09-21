"""Notification center router — Module 20 endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    customer: CurrentCustomer,
    unread_only: bool = False,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> dict:
    svc = get_composition().notification_service()
    return ok(await svc.list(str(customer["customer_id"]),
                             unread_only=unread_only,
                             limit=limit, offset=offset))


@router.get("/unread-count")
async def unread_count(customer: CurrentCustomer) -> dict:
    svc = get_composition().notification_service()
    return ok({"unread_count": await svc.unread_count(str(customer["customer_id"]))})


@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().notification_service()
    return ok({"marked": await svc.mark_read(str(customer["customer_id"]), notification_id)})


@router.post("/read-all")
async def mark_all(customer: CurrentCustomer) -> dict:
    svc = get_composition().notification_service()
    return ok({"marked": await svc.mark_all(str(customer["customer_id"]))})
