"""Messaging domain router — Module 19 endpoints (customer side)."""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/bookings/{booking_id}", tags=["messaging"])


class MessageSend(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


@router.get("/messages")
async def thread(
    booking_id: str, customer: CurrentCustomer,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    svc = get_composition().conversation_service()
    return ok(await svc.thread(str(customer["customer_id"]), booking_id,
                               limit=limit, offset=offset))


@router.post("/messages", status_code=201)
async def send(booking_id: str, payload: MessageSend, customer: CurrentCustomer) -> dict:
    svc = get_composition().conversation_service()
    result = await svc.send(str(customer["customer_id"]), booking_id, payload.body)
    return ok(result, title="Message sent", status_code=201)