"""Provider Job Evidence — API routes (Requirement Phase 22)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_job_evidence_service import (
    ProviderJobEvidenceService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/evidence", tags=["provider-evidence"])


def _service() -> ProviderJobEvidenceService:
    return get_composition().provider_job_evidence_service()


class EvidenceBody(BaseModel):
    phase: str = Field(..., min_length=1, max_length=10)
    kind: str = Field(..., min_length=1, max_length=20)
    title: str | None = Field(None, max_length=200)
    body: str | None = None
    media_url: str | None = None
    quantity: float | None = None
    unit: str | None = Field(None, max_length=50)


@router.post("/bookings/{booking_id}")
async def add_evidence(
    booking_id: str,
    body: EvidenceBody,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.add(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
        phase=body.phase,
        kind=body.kind,
        title=body.title,
        body=body.body,
        media_url=body.media_url,
        quantity=body.quantity,
        unit=body.unit,
    )


@router.get("/bookings/{booking_id}")
async def list_evidence(
    booking_id: str,
    phase: str | None = Query(None),
    kind: str | None = Query(None),
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.list_for_booking(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
        phase=phase,
        kind=kind,
    )


@router.get("/bookings/{booking_id}/summary")
async def evidence_summary(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.summary(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
    )


@router.delete("/bookings/{booking_id}/{evidence_id}")
async def delete_evidence(
    booking_id: str,
    evidence_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.delete(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
        evidence_id=evidence_id,
    )
