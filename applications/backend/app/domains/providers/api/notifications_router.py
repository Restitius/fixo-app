"""Provider notifications router (Requirement Phase 37).

Prefix: /providers/me/notifications

- GET /                list notifications (optional status, category filters)
- GET /unread-count     count of unread notifications
- GET /{item_id}        single notification
- PATCH /{item_id}/read mark as read
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_notifications_service import (
    ProviderNotificationsService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/notifications", tags=["provider-notifications"])


def _service() -> ProviderNotificationsService:
    return get_composition().provider_notifications_service()


@router.get("/")
async def list_notifications(
    status: str | None = Query(None, pattern="unread|all"),
    category: str | None = Query(None, max_length=64),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """List provider notifications, unread first then newest."""
    svc = _service()
    return ok(
        await svc.list_notifications(
            provider_id=str(provider["provider_id"]),
            status=status,
            category=category,
            limit=limit,
            offset=offset,
        )
    )


@router.get("/unread-count")
async def get_unread_count(
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Return the count of unread notifications.

    Registered before /{item_id} — a static path segment must come before a
    dynamic one with the same prefix, or FastAPI/Starlette's registration-
    order route matching swallows it (matched "unread-count" as item_id,
    crashing the DB query with an invalid-UUID error). Found via live
    end-to-end testing against the real backend this session.
    """
    svc = _service()
    return ok(await svc.get_unread_count(provider_id=str(provider["provider_id"])))


@router.get("/{item_id}")
async def get_notification(
    item_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Fetch a single notification by id (ownership-checked)."""
    svc = _service()
    return ok(await svc.get_notification(provider_id=str(provider["provider_id"]), notification_id=item_id))


@router.patch("/{item_id}/read")
async def mark_read(
    item_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Mark a notification as read (idempotent)."""
    svc = _service()
    return ok(await svc.mark_read(provider_id=str(provider["provider_id"]), notification_id=item_id))
