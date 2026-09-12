"""ProviderNotificationsService — notification read-state (Requirement Phase 32).

Provider-facing notifications: list history (optionally filtered by status
or category), unread count, and idempotent mark-read. No background delivery
or workers — synchronous through this service layer.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError


class ProviderNotificationsService:
    """Domain service for provider notification read state."""

    def __init__(self, notifications: Any) -> None:
        self._notifications = notifications

    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        if status is not None and status not in ("unread", "read", "all"):
            raise ValidationError("status must be one of: unread, read, all")
        if category is not None and not category.strip():
            raise ValidationError("category must not be blank")
        if limit < 1 or limit > 100:
            raise ValidationError("limit must be between 1 and 100")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._notifications.list(
            provider_id,
            status=status,
            category=category,
            limit=limit,
            offset=offset,
        )
        return {
            "notifications": [self._encode(n) for n in rows],
            "limit": limit,
            "offset": offset,
        }

    async def unread_count(self, provider_id: str) -> dict[str, Any]:
        count = await self._notifications.unread_count(provider_id)
        return {"unread_count": count}

    async def mark_read(self, provider_id: str, notification_id: str) -> dict[str, Any]:
        row = await self._notifications.mark_read(provider_id, notification_id)
        if row is None:
            raise NotFoundError("Notification not found")
        return self._encode(row)

    @staticmethod
    def _encode(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "notification_id": str(row.get("id") or ""),
            "provider_id": str(row.get("provider_id") or ""),
            "channel": str(row.get("channel") or ""),
            "category": str(row.get("category") or ""),
            "title": str(row.get("title") or ""),
            "body": row.get("body"),
            "is_read": bool(row.get("is_read")),
            "reference_type": row.get("reference_type"),
            "reference_id": str(row.get("reference_id") or "") if row.get("reference_id") else None,
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }
