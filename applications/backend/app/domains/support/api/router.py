"""Support domain router - Module 38 (customer helpdesk)."""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/support", tags=["support"])


class CreateTicketRequest(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    category: str = "GENERAL"
    priority: str = "MEDIUM"


class AddMessageRequest(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


@router.post("/tickets", status_code=201)
async def create_ticket(payload: CreateTicketRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().support_service()
    ticket = await svc.create_ticket(
        str(customer["customer_id"]), payload.subject, payload.category, payload.priority
    )
    return ok(ticket, title="Support ticket opened", status_code=201)


@router.get("/tickets")
async def list_tickets(
    customer: CurrentCustomer,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().support_service()
    return ok(await svc.list_tickets(str(customer["customer_id"]), limit=limit, offset=offset))


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().support_service()
    return ok(await svc.get_ticket(ticket_id, str(customer["customer_id"])))


@router.post("/tickets/{ticket_id}/messages", status_code=201)
async def add_message(
    ticket_id: str, payload: AddMessageRequest, customer: CurrentCustomer,
) -> dict:
    svc = get_composition().support_service()
    message = await svc.add_message(
        ticket_id, str(customer["customer_id"]), sender="CUSTOMER", body=payload.body
    )
    return ok(message, title="Message added", status_code=201)


@router.get("/tickets/{ticket_id}/messages")
async def list_messages(
    ticket_id: str,
    customer: CurrentCustomer,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().support_service()
    return ok(
        await svc.list_messages(ticket_id, str(customer["customer_id"]), limit=limit, offset=offset)
    )
