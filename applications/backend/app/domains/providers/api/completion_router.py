"""Provider Job Completion — API routes (Requirement Phase 25)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_job_completion_service import (
    ProviderJobCompletionService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/completion", tags=["provider-completion"])


def _service() -> ProviderJobCompletionService:
    return get_composition().provider_job_completion_service()


class CompleteBody(BaseModel):
    completion_notes: str | None = None
    work_performed: str | None = None
    materials_summary: str | None = None
    before_after_evidence: list[str] | None = None
    warranty_details: str | None = Field(None, max_length=500)
    recommended_followup: str | None = None
    maintenance_recommendations: str | None = None


@router.post("/bookings/{booking_id}/complete", status_code=201)
async def complete_job(
    booking_id: str,
    body: CompleteBody,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.complete(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
            completion_notes=body.completion_notes,
            work_performed=body.work_performed,
            materials_summary=body.materials_summary,
            before_after_evidence=body.before_after_evidence,
            warranty_details=body.warranty_details,
            recommended_followup=body.recommended_followup,
            maintenance_recommendations=body.maintenance_recommendations,
        )
    )


@router.get("/bookings/{booking_id}")
async def get_completion_report(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.get_report(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )
