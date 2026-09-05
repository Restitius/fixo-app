"""Provider verification routes — identity documents + submission (Provider Req Phase 5).

Provider-owned endpoints only. The platform-side review endpoints
(document decision / provider status transition) exist as service methods
and are exposed with the platform admin module behind an admin guard.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/verification", tags=["provider-verification"])


class AddDocumentRequest(BaseModel):
    """Upload one verification document (one active per type)."""

    doc_type: str = Field(max_length=40)
    front_image_url: str = Field(max_length=500)
    back_image_url: str | None = Field(default=None, max_length=500)
    doc_number: str | None = Field(default=None, max_length=80)
    issue_date: date | None = None
    expiry_date: date | None = None


def _service() -> Any:
    return get_composition().provider_verification_service()


@router.get("/doc-types")
async def list_doc_types(provider: CurrentProvider) -> Any:
    """Acceptable verification documents (governed catalogue)."""
    return ok(await _service().doc_types())


@router.get("/documents")
async def list_documents(provider: CurrentProvider) -> Any:
    """The provider's own uploaded verification documents."""
    return ok(await _service().documents(str(provider["provider_id"])))


@router.post("/documents", status_code=201)
async def add_document(payload: AddDocumentRequest, provider: CurrentProvider) -> Any:
    """Upload a verification document (SUBMITTED; enters the review pipeline)."""
    data = payload.model_dump(exclude_unset=True)
    return ok(await _service().add_document(str(provider["provider_id"]), data))


@router.delete("/documents/{doc_id}")
async def withdraw_document(doc_id: str, provider: CurrentProvider) -> Any:
    """Withdraw a not-yet-verified document (soft delete; re-upload replaces it)."""
    return ok(await _service().withdraw_document(str(provider["provider_id"]), doc_id))


@router.get("/status")
async def verification_status(provider: CurrentProvider) -> Any:
    """Progress aggregate: counts, required-missing types, expiring soon."""
    return ok(await _service().status(str(provider["provider_id"])))


@router.post("/submit")
async def submit_verification(provider: CurrentProvider) -> Any:
    """Submit the package for review (requires every required doc verified-pending)."""
    return ok(await _service().submit(str(provider["provider_id"])))
