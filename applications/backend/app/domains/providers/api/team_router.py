"""Provider team management router - Phase 44.

Prefix: /providers/me/team
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/team", tags=["provider-team"])


class CreateTeamMemberRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=1, max_length=20)
    email: str | None = Field(default=None, max_length=180)
    role: str = "TECHNICIAN"
    notes: str | None = Field(default=None, max_length=2000)


class UpdateTeamMemberRequest(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=180)
    role: str | None = None
    notes: str | None = Field(default=None, max_length=2000)


@router.post("/", status_code=201)
async def create_member(payload: CreateTeamMemberRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_team_service()
    member = await svc.create_member(
        str(provider["provider_id"]),
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        role=payload.role,
        notes=payload.notes,
    )
    return ok(member, title="Team member added", status_code=201)


@router.get("/")
async def list_members(
    provider: CurrentProvider,
    status: str | None = Query(None),
    role: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_team_service()
    return ok(
        await svc.list_members(
            str(provider["provider_id"]), status=status, role=role, limit=limit, offset=offset
        )
    )


@router.get("/{member_id}")
async def get_member(member_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_team_service()
    return ok(await svc.get_member(str(provider["provider_id"]), member_id=member_id))


@router.patch("/{member_id}")
async def update_member(
    member_id: str, payload: UpdateTeamMemberRequest, provider: CurrentProvider
) -> dict:
    svc = get_composition().provider_team_service()
    member = await svc.update_member(
        str(provider["provider_id"]),
        member_id=member_id,
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        role=payload.role,
        notes=payload.notes,
    )
    return ok(member, title="Team member updated")


@router.post("/{member_id}/deactivate")
async def deactivate_member(member_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_team_service()
    result = await svc.deactivate_member(str(provider["provider_id"]), member_id=member_id)
    return ok(result, title="Team member deactivated")
