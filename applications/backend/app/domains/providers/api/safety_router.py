"""Provider safety & incident reporting router - Phase 41.

Prefix: /providers/me/safety
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/safety", tags=["provider-safety"])


class CreateReportRequest(BaseModel):
    booking_id: str | None = None
    category: str = "OTHER"
    severity: str = "LOW"
    description: str = Field(min_length=10, max_length=4000)


@router.post("/reports", status_code=201)
async def create_report(payload: CreateReportRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_safety_service()
    report = await svc.create_report(
        str(provider["provider_id"]),
        booking_id=payload.booking_id,
        category=payload.category,
        severity=payload.severity,
        description=payload.description,
    )
    return ok(report, title="Safety report filed", status_code=201)


@router.get("/reports")
async def list_reports(
    provider: CurrentProvider,
    status: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_safety_service()
    return ok(
        await svc.list_reports(
            str(provider["provider_id"]),
            status=status,
            category=category,
            limit=limit,
            offset=offset,
        )
    )


@router.get("/reports/{report_id}")
async def get_report(report_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_safety_service()
    return ok(await svc.get_report(str(provider["provider_id"]), report_id=report_id))


@router.post("/reports/{report_id}/escalate")
async def escalate_report(report_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_safety_service()
    result = await svc.escalate(str(provider["provider_id"]), report_id=report_id)
    return ok(result, title="Report escalated")
