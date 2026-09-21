"""Notification preferences — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class PreferencesNotificationRequest(BaseSchema):
    """Notification preferences payload (camelCase over the wire)."""

    notes: str | None = None
