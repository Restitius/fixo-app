"""Notification filter hints — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class NotificationFilterRequest(BaseSchema):
    """Notification filter hints payload (camelCase over the wire)."""

    search: str | None = None
    status: str | None = None
