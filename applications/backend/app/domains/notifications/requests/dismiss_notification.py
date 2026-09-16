"""Notification dismiss — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class DismissNotificationRequest(BaseSchema):
    """Notification dismiss payload (camelCase over the wire)."""

    notes: str | None = None
