"""Provider Materials & Expenses — API routes (Requirement Phase 24)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_materials_service import (
    ProviderMaterialsService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/materials", tags=["provider-materials"])


def _service() -> ProviderMaterialsService:
    return get_composition().provider_materials_service()


class MaterialBody(BaseModel):
    item_name: str = Field(..., min_length=1, max_length=200)
    quantity: float = Field(1, gt=0)
    unit_cost: float | None = Field(None, ge=0)
    amount: float | None = Field(None, ge=0)
    currency: str = Field("TZS", min_length=3, max_length=3)
    note: str | None = None
    attachment_url: str | None = None
    attachment_kind: str | None = Field(None, max_length=12)  # RECEIPT|PHOTO|INVOICE


@router.post("/bookings/{booking_id}", status_code=201)
async def add_material(
    booking_id: str,
    body: MaterialBody,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.add(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
        item_name=body.item_name,
        quantity=body.quantity,
        unit_cost=body.unit_cost,
        amount=body.amount,
        currency=body.currency,
        note=body.note,
        attachment_url=body.attachment_url,
        attachment_kind=body.attachment_kind,
    )


@router.get("/bookings/{booking_id}")
async def list_materials(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.list_for_booking(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
    )


@router.get("/bookings/{booking_id}/summary")
async def materials_summary(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.summary(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
    )


@router.delete("/bookings/{booking_id}/{material_id}")
async def delete_material(
    booking_id: str,
    material_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return await svc.delete(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
        material_id=material_id,
    )
