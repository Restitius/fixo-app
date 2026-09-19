"""Provider support router - Phase 40 (provider helpdesk).

Prefix: /providers/me/support
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/support", tags=["provider-support"])


class CreateTicketRequest(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    category: str = "GENERAL"
    priority: str = "MEDIUM"


class AddMessageRequest(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


@router.post("/tickets", status_code=201)
async def create_ticket(payload: CreateTicketRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_support_service()
    ticket = await svc.create_ticket(
        str(provider["provider_id"]), payload.subject, payload.category, payload.priority
    )
    return ok(ticket, title="Support ticket opened", status_code=201)


@router.get("/tickets")
async def list_tickets(
    provider: CurrentProvider,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_support_service()
    return ok(await svc.list_tickets(str(provider["provider_id"]), limit=limit, offset=offset))


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_support_service()
    return ok(await svc.get_ticket(ticket_id, str(provider["provider_id"])))


@router.post("/tickets/{ticket_id}/messages", status_code=201)
async def add_message(
    ticket_id: str, payload: AddMessageRequest, provider: CurrentProvider,
) -> dict:
    svc = get_composition().provider_support_service()
    message = await svc.add_message(
        ticket_id, str(provider["provider_id"]), sender="PROVIDER", body=payload.body
    )
    return ok(message, title="Message added", status_code=201)


@router.get("/tickets/{ticket_id}/messages")
async def list_messages(
    ticket_id: str,
    provider: CurrentProvider,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_support_service()
    return ok(
        await svc.list_messages(ticket_id, str(provider["provider_id"]), limit=limit, offset=offset)
    )
