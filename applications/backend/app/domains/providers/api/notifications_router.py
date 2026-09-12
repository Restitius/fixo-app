"""Provider notifications router (Requirement Phase 32).

Prefix: /providers/me/notifications

- GET    /                      list notifications (status=unread|read|all, category)
- GET    /unread-count          unread count
- PATCH  /{notification_id}/read mark a notification as read
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_notifications_service import (
    ProviderNotificationsService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/notifications", tags=["provider-notifications"])


def _service() -> ProviderNotificationsService:
    return get_composition().provider_notifications_service()


@router.get("")
async def list_notifications(
    status: str | None = Query("all", pattern="^(unread|read|all)$"),
    category: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    return await _service().list(
        str(provider["provider_id"]),
        status=status,
        category=category,
        limit=limit,
        offset=offset,
    )


@router.get("/unread-count")
async def unread_count(provider: dict = Depends(get_current_provider)) -> dict[str, Any]:
    return await _service().unread_count(str(provider["provider_id"]))


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    return await _service().mark_read(str(provider["provider_id"]), notification_id)
