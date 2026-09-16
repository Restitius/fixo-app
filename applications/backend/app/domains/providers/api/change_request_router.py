"""Provider Change Request — API routes (Requirement Phase 23)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_change_request_service import (
    ProviderChangeRequestService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/change-requests", tags=["provider-change-requests"])


def _service() -> ProviderChangeRequestService:
    return get_composition().provider_change_request_service()


class ChangeSubmitBody(BaseModel):
    change_type: str = Field(..., min_length=1, max_length=10)  # SCOPE|TIME|PRICE
    proposed_value: str = Field(..., min_length=1, max_length=500)
    reason: str | None = Field(None, max_length=500)
    new_work: str | None = Field(None, max_length=500)
    additional_labour: float | None = Field(None, ge=0)
    additional_materials: float | None = Field(None, ge=0)
    additional_time_minutes: int | None = Field(None, ge=0)
    additional_price: float | None = Field(None, ge=0)
    currency: str = Field("TZS", min_length=3, max_length=3)
    supporting_photos: list[str] | None = None


@router.post("/bookings/{booking_id}", status_code=201)
async def submit_change_request(
    booking_id: str,
    body: ChangeSubmitBody,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.submit(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
            change_type=body.change_type,
            proposed_value=body.proposed_value,
            reason=body.reason,
            new_work=body.new_work,
            additional_labour=body.additional_labour,
            additional_materials=body.additional_materials,
            additional_time_minutes=body.additional_time_minutes,
            additional_price=body.additional_price,
            currency=body.currency,
            supporting_photos=body.supporting_photos,
        )
    )


@router.get("/bookings/{booking_id}")
async def list_change_requests(
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


@router.get("/bookings/{booking_id}/{change_id}")
async def get_change_request(
    booking_id: str,
    change_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.get(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
            change_id=change_id,
        )
    )


@router.delete("/bookings/{booking_id}/{change_id}")
async def withdraw_change_request(
    booking_id: str,
    change_id: str,
    provider: dict = Depends(get_current_provider),
):
    svc = _service()
    return ok(
        await svc.withdraw(
            provider_id=str(provider["provider_id"]),
            booking_id=booking_id,
            change_id=change_id,
        )
    )
