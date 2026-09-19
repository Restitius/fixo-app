"""Provider sign-off / approval evidence router (Phase 26).

Prefix: /providers/me/reviews

- POST   /bookings/{booking_id}          record the customer sign-off (or refresh it)
- GET    /bookings/{booking_id}          the sign-off record for one of the provider's bookings
- GET    /waiting                        the provider's bookings awaiting sign-off beyond 24h
- DELETE /bookings/{booking_id}/{review_id}  provider removes its sign-off record
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_job_review_service import (
    ProviderJobReviewService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/reviews", tags=["provider-reviews"])


def _service() -> ProviderJobReviewService:
    return get_composition().provider_job_review_service()


class ReviewSubmitBody(BaseModel):
    sign_off: str = Field(
        ..., min_length=1, max_length=30,
        pattern=r"^(DIGITAL_SIGNATURE|COMPLETION_PIN|APP_CONFIRMATION)$",
    )
    approval_evidence: str = Field("", max_length=4000)


@router.post("/bookings/{booking_id}", status_code=201)
async def submit_review(
    booking_id: str,
    body: ReviewSubmitBody,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    svc = _service()
    return await svc.submit(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
        sign_off=body.sign_off,
        approval_evidence=body.approval_evidence,
    )


@router.get("/bookings/{booking_id}")
async def get_review(
    booking_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any] | None:
    svc = _service()
    return await svc.get(
        provider_id=str(provider["provider_id"]),
        booking_id=booking_id,
    )


@router.get("/waiting")
async def list_waiting(
    provider: dict = Depends(get_current_provider),
) -> list[dict[str, Any]]:
    svc = _service()
    return await svc.waiting(provider_id=str(provider["provider_id"]))


@router.delete("/bookings/{booking_id}/{review_id}", status_code=200)
async def delete_review(
    booking_id: str,
    review_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any] | None:
    svc = _service()
    return await svc.delete(
        provider_id=str(provider["provider_id"]),
        review_id=review_id,
    )
