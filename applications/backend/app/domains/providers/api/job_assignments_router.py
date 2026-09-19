"""Provider job assignment router - Phase 45 (dispatch/technician).

Prefix: /providers/me/job-assignments
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/job-assignments", tags=["provider-job-assignments"])


class CreateAssignmentRequest(BaseModel):
    booking_id: str
    member_id: str
    notes: str | None = Field(default=None, max_length=2000)


class UpdateAssignmentRequest(BaseModel):
    member_id: str | None = None
    status: str | None = None
    notes: str | None = Field(default=None, max_length=2000)


@router.post("/", status_code=201)
async def create_assignment(payload: CreateAssignmentRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_job_assignments_service()
    record = await svc.create(
        str(provider["provider_id"]),
        booking_id=payload.booking_id,
        member_id=payload.member_id,
        notes=payload.notes,
    )
    return ok(record, title="Job assigned", status_code=201)


@router.get("/")
async def list_assignments(
    provider: CurrentProvider,
    status: str | None = Query(None),
    member_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_job_assignments_service()
    return ok(
        await svc.list_assignments(
            str(provider["provider_id"]), status=status, member_id=member_id,
            limit=limit, offset=offset,
        )
    )


@router.get("/{assignment_id}")
async def get_assignment(assignment_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_job_assignments_service()
    return ok(await svc.get(str(provider["provider_id"]), assignment_id=assignment_id))


@router.patch("/{assignment_id}")
async def update_assignment(
    assignment_id: str, payload: UpdateAssignmentRequest, provider: CurrentProvider
) -> dict:
    svc = get_composition().provider_job_assignments_service()
    record = await svc.update(
        str(provider["provider_id"]),
        assignment_id=assignment_id,
        member_id=payload.member_id,
        status=payload.status,
        notes=payload.notes,
    )
    return ok(record, title="Assignment updated")


@router.post("/{assignment_id}/cancel")
async def cancel_assignment(assignment_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_job_assignments_service()
    result = await svc.cancel(str(provider["provider_id"]), assignment_id=assignment_id)
    return ok(result, title="Assignment cancelled")
