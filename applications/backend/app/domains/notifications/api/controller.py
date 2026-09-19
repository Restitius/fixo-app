"""NotificationController — thin HTTP translation layer (section 35)."""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class NotificationController:
    """Converts requests to DTOs, calls the service, wraps resources."""

    @classmethod
    async def list_notifications(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Notification list_notifications pipeline not implemented yet")

    @classmethod
    async def mark_read(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Notification mark_read pipeline not implemented yet")
    @classmethod
    async def dismiss(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Notification dismiss pipeline not implemented yet")
    @classmethod
    async def update_preferences(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Notification update_preferences pipeline not implemented yet")
