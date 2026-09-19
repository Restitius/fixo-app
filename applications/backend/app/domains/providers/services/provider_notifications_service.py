"""ProviderNotificationsService — provider notifications (Requirement Phase 37).

Manages provider-facing notifications: list with filters (status, category),
fetch single by id (ownership-scoped), mark read (idempotent), and count
unread.

Notification channels: in_app, email, sms.
Categories: booking, payout, review, system, etc.

No delivery workers in this phase — notifications are managed synchronously
through the service layer.
"""

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

# -- pagination defaults ----------------------------------------------------------
DEFAULT_LIMIT = 50
MAX_LIMIT = 100

# -- notification status filter values --------------------------------------------
NOTIFICATION_STATUSES = frozenset({"unread", "all"})


class ProviderNotificationsService:
    """Domain service for provider notification operations."""

    def __init__(self, notifications: Any) -> None:
        self._notifications = notifications

    # -- notifications --------------------------------------------------------------

    async def list_notifications(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List provider notifications, unread first then newest.

        Args:
            status: filter by read state (unread|all). None means all.
            category: filter by notification category. None means all.
            limit: max rows to return (1-100).
            offset: rows to skip for pagination.

        Returns a structured dict with notifications list and pagination metadata.
        """
        if status is not None and status not in NOTIFICATION_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(NOTIFICATION_STATUSES))}"
            )
        if limit < 1 or limit > MAX_LIMIT:
            raise ValidationError(f"limit must be between 1 and {MAX_LIMIT}")
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
            "notifications": [self._encode_notification(r) for r in rows],
            "limit": limit,
            "offset": offset,
        }

    async def get_notification(
        self, provider_id: str, *, notification_id: str
    ) -> dict[str, Any]:
        """Fetch a single notification by id (ownership-checked).

        Raises NotFoundError when the notification does not exist or is not
        owned by the requesting provider.
        """
        row = await self._notifications.get(
            provider_id, notification_id=notification_id
        )
        if row is None:
            raise NotFoundError("Notification not found")
        return self._encode_notification(row)

    async def mark_read(
        self, provider_id: str, *, notification_id: str
    ) -> dict[str, Any]:
        """Mark a notification as read (idempotent).

        Raises NotFoundError when the notification does not exist or is not
        owned by the requesting provider.
        """
        row = await self._notifications.mark_read(
            provider_id, notification_id=notification_id
        )
        if row is None:
            raise NotFoundError("Notification not found")
        return self._encode_notification(row)

    async def get_unread_count(self, provider_id: str) -> dict[str, Any]:
        """Return the count of unread notifications for a provider."""
        count = await self._notifications.unread_count(provider_id)
        return {"unread_count": count}

    # -- encoding helpers -----------------------------------------------------------

    @staticmethod
    def _encode_notification(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a notification row for API output."""
        return {
            "id": str(row.get("id") or ""),
            "channel": str(row.get("channel") or "in_app"),
            "category": str(row.get("category") or ""),
            "title": str(row.get("title") or ""),
            "body": str(row.get("body") or ""),
            "is_read": bool(row.get("is_read")),
            "reference_type": str(row.get("reference_type") or ""),
            "reference_id": str(row.get("reference_id") or ""),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }
