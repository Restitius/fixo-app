"""Provider DSL requests router (Requirement Phase 38).

Prefix: /providers/me/dsl-requests

- GET /                list DSL requests (optional status, dsl_kind filters)
- GET /{request_id}    single DSL request
- POST /               create DSL request
- PATCH /{request_id}  update mutable fields
- POST /{request_id}/resolve  close as resolved
- GET /{request_id}/logs      execution steps
- GET /metrics/summary        provider lifetime metrics by period
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_dsl_requests_service import (
    ProviderDslRequestsService,
)
from app.startup.composition import get_composition

router = APIRouter(
    prefix="/providers/me/dsl-requests", tags=["provider-dsl-requests"]
)


def _service() -> ProviderDslRequestsService:
    return get_composition().provider_dsl_requests_service()


class DslRequestBody(BaseModel):
    """Payload for creating a DSL request."""

    dsl_kind: str = Field(pattern="^(cancellation|reschedule)$")
    subject_type: str = Field(min_length=1, max_length=64)
    subject_id: str = Field(min_length=1, max_length=36)
    title: str = Field(min_length=1, max_length=256)
    dsl: dict[str, Any]
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    reason: str | None = None
    parent_id: str | None = None
    root_request_id: str | None = None


class DslRequestUpdateBody(BaseModel):
    """Payload for updating a DSL request."""

    status: str | None = Field(
        default=None, pattern="^(open|escalated|closed|canceled)$"
    )
    priority: str | None = Field(
        default=None, pattern="^(low|medium|high|urgent)$"
    )
    reason: str | None = None
    title: str | None = Field(default=None, max_length=256)
    dsl: dict[str, Any] | None = None


@router.get("/")
async def list_requests(
    status: str | None = Query(None, pattern="^(open|escalated|closed|canceled|all)$"),
    dsl_kind: str | None = Query(None, pattern="^(cancellation|reschedule)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """List provider DSL requests, newest first."""
    svc = _service()
    return await svc.list_requests(
        str(provider["provider_id"]),
        status=status,
        dsl_kind=dsl_kind,
        limit=limit,
        offset=offset,
    )


@router.get("/metrics/summary")
async def get_metrics(
    period: str = Query(..., min_length=1, max_length=64),
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Return provider DSL lifetime metrics for a period."""
    svc = _service()
    return await svc.get_metrics(str(provider["provider_id"]), period=period)


@router.get("/{request_id}")
async def get_request(
    request_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Fetch a single DSL request by id (ownership-checked)."""
    svc = _service()
    return await svc.get_request(str(provider["provider_id"]), request_id=request_id)


@router.post("/", status_code=201)
async def create_request(
    body: DslRequestBody,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Create one DSL request for the current provider."""
    svc = _service()
    return await svc.create_request(
        str(provider["provider_id"]),
        dsl_kind=body.dsl_kind,
        subject_type=body.subject_type,
        subject_id=body.subject_id,
        title=body.title,
        dsl=body.dsl,
        priority=body.priority,
        reason=body.reason,
        parent_id=body.parent_id,
        root_request_id=body.root_request_id,
    )


@router.patch("/{request_id}")
async def update_request(
    request_id: str,
    body: DslRequestUpdateBody,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Update mutable DSL request fields (ownership-checked)."""
    svc = _service()
    return await svc.update_request(
        str(provider["provider_id"]),
        request_id=request_id,
        status=body.status,
        priority=body.priority,
        reason=body.reason,
        title=body.title,
        dsl=body.dsl,
    )


@router.post("/{request_id}/resolve")
async def resolve_request(
    request_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Close a DSL request as resolved (ownership-checked)."""
    svc = _service()
    return await svc.resolve_request(str(provider["provider_id"]), request_id=request_id)


@router.get("/{request_id}/logs")
async def list_execution_logs(
    request_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Read execution steps for a DSL request (ownership-checked)."""
    svc = _service()
    return await svc.list_execution_logs(
        str(provider["provider_id"]), request_id=request_id
    )
