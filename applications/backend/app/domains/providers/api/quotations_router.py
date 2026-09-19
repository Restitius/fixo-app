"""Provider quotation routes — professional quotations (Provider Req Phase 13).

Draft → Submitted → (Viewed) → Accepted/Rejected/Expired/Withdrawn.
Static paths (/attachments) are declared before /{quote_id} so FastAPI does
not shadow them.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/quotations", tags=["provider-quotations"])


class SaveQuoteRequest(BaseModel):
    """Professional quotation breakdown (partial accepted for drafts)."""

    quote_id: str | None = None
    total_amount: float | None = Field(default=None, gt=0)
    labour_cost: float | None = Field(default=None, ge=0)
    materials_cost: float | None = Field(default=None, ge=0)
    transport_cost: float | None = Field(default=None, ge=0)
    inspection_fee: float | None = Field(default=None, ge=0)
    additional_charges: float | None = Field(default=None, ge=0)
    tax_amount: float | None = Field(default=None, ge=0)
    discount_amount: float | None = Field(default=None, ge=0)
    platform_fee: float | None = Field(default=None, ge=0)
    currency: str = Field(default="TZS", max_length=3)
    lead_time_days: int = Field(default=1, ge=0)
    estimated_hours: int | None = Field(default=None, ge=1)
    proposed_start_date: str | None = None
    notes: str | None = Field(default=None, max_length=3000)
    terms: str | None = Field(default=None, max_length=3000)


class AddAttachmentRequest(BaseModel):
    """A photo or document on a quote."""

    kind: str = Field(max_length=10)
    url: str = Field(min_length=1, max_length=500)
    label: str | None = Field(default=None, max_length=160)


def _service() -> Any:
    return get_composition().provider_quotation_service()


@router.get("")
async def list_quotes(provider: CurrentProvider) -> Any:
    """This provider's quotations, newest first (expiring stale ones first)."""
    return ok(await _service().list(str(provider["provider_id"])))


@router.get("/{quote_id}")
async def get_quote(quote_id: str, provider: CurrentProvider) -> Any:
    """One quotation with its full breakdown."""
    return ok(await _service().get(str(provider["provider_id"]), quote_id))


@router.get("/{quote_id}/attachments")
async def get_attachments(quote_id: str, provider: CurrentProvider) -> Any:
    """Photos/documents on one of my quotations."""
    return ok(
        await _service().get_attachments(str(provider["provider_id"]), quote_id)
    )


@router.post("/{quote_id}/attachments")
async def add_attachment(
    quote_id: str, payload: AddAttachmentRequest, provider: CurrentProvider
) -> Any:
    """Attach a photo/document to my own DRAFT/SUBMITTED quote."""
    return ok(
        await _service().add_attachment(
            str(provider["provider_id"]),
            quote_id,
            payload.model_dump(exclude_unset=True),
        )
    )


@router.delete("/{quote_id}/attachments/{attachment_id}")
async def remove_attachment(
    quote_id: str, attachment_id: str, provider: CurrentProvider
) -> Any:
    """Delete one attachment from my own quote."""
    return ok(
        await _service().remove_attachment(
            str(provider["provider_id"]), attachment_id
        )
    )


@router.post("/{request_id}")
async def save_quote(
    request_id: str, payload: SaveQuoteRequest, provider: CurrentProvider
) -> Any:
    """Create a DRAFT or upgrade my quote with a professional breakdown."""
    return ok(
        await _service().save(
            str(provider["provider_id"]),
            request_id,
            payload.model_dump(exclude_unset=True),
        )
    )


@router.post("/{quote_id}/submit")
async def submit_quote(quote_id: str, provider: CurrentProvider) -> Any:
    """Publish a DRAFT quote into the marketplace."""
    return ok(await _service().submit(str(provider["provider_id"]), quote_id))


@router.post("/{quote_id}/withdraw")
async def withdraw_quote(quote_id: str, provider: CurrentProvider) -> Any:
    """Withdraw a submitted quote."""
    return ok(await _service().withdraw(str(provider["provider_id"]), quote_id))