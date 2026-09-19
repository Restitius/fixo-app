"""Provider Job Checklist — API routes (Requirement Phase 21)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_job_checklist_service import (
    ProviderJobChecklistService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/checklist", tags=["provider-checklist"])


def _service() -> ProviderJobChecklistService:
    return get_composition().provider_job_checklist_service()


class TemplateBody(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    items: list[str] = Field(..., min_length=1)


class SetCompletedBody(BaseModel):
    is_completed: bool = True


class InstantiateBody(BaseModel):
    service_id: str = Field(..., min_length=1)


@router.put("/templates/{service_id}")
async def upsert_template(
    service_id: str,
    body: TemplateBody,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.upsert_template(
            provider_id=str(provider["provider_id"]),
            service_id=service_id,
            title=body.title,
            items=body.items,
        )
    )


@router.get("/templates/{service_id}")
async def get_template(
    service_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.get_template(
            provider_id=str(provider["provider_id"]),
            service_id=service_id,
        )
    )


@router.delete("/templates/{service_id}")
async def delete_template(
    service_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.delete_template(
            provider_id=str(provider["provider_id"]),
            service_id=service_id,
        )
    )


@router.post("/bookings/{booking_id}/instantiate")
async def instantiate(
    booking_id: str,
    body: InstantiateBody,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.instantiate(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
            service_id=body.service_id,
        )
    )


@router.get("/bookings/{booking_id}")
async def list_for_booking(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.list_for_booking(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )


@router.post("/bookings/{booking_id}/items/{item_id}/complete")
async def set_completed(
    booking_id: str,
    item_id: str,
    body: SetCompletedBody | None = None,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.set_completed(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
            item_id=item_id,
            is_completed=body.is_completed if body else True,
        )
    )


@router.get("/bookings/{booking_id}/progress")
async def progress(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.progress(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
        )
    )
