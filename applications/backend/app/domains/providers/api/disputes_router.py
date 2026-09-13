"""Provider disputes router (Requirement Phase 39).

Prefix: /providers/me/disputes

- GET /                list provider disputes (optional status, booking filters)
- GET /{dispute_id}    single dispute
- GET /{dispute_id}/evidence      dispute evidence
- POST /{dispute_id}/responses    submit a provider response
- GET /{dispute_id}/responses     list provider responses
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_disputes_service import (
    ProviderDisputesService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/disputes", tags=["provider-disputes"])


def _service() -> ProviderDisputesService:
    return get_composition().provider_disputes_service()


class DisputeResponseBody(BaseModel):
    """Payload for a provider dispute response."""

    kind: str = Field(
        pattern="^(acknowledgment|explanation|refund_offer)$"
    )
    body: str = Field(min_length=1, max_length=4000)


@router.get("/")
async def list_disputes(
    status: str | None = Query(None, pattern="^(open|under_review|resolved|withdrawn|all)$"),
    booking_id: str | None = Query(None, max_length=36),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """List provider disputes, newest first."""
    svc = _service()
    return await svc.list_disputes(
        str(provider["provider_id"]),
        status=status,
        booking_id=booking_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{dispute_id}")
async def get_dispute(
    dispute_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Fetch a single dispute by id (ownership-checked)."""
    svc = _service()
    return await svc.get_dispute(str(provider["provider_id"]), dispute_id=dispute_id)


@router.get("/{dispute_id}/evidence")
async def list_evidence(
    dispute_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """List evidence on a dispute (ownership-checked)."""
    svc = _service()
    return await svc.list_evidence(str(provider["provider_id"]), dispute_id=dispute_id)


@router.post("/{dispute_id}/responses", status_code=201)
async def add_response(
    dispute_id: str,
    body: DisputeResponseBody,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Submit a provider response on an owned dispute."""
    svc = _service()
    return await svc.respond(
        str(provider["provider_id"]),
        dispute_id=dispute_id,
        kind=body.kind,
        body=body.body,
    )


@router.get("/{dispute_id}/responses")
async def list_responses(
    dispute_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """List provider responses for a dispute (ownership-checked)."""
    svc = _service()
    return await svc.list_responses(str(provider["provider_id"]), dispute_id=dispute_id)