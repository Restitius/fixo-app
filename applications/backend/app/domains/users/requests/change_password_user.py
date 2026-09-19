"""User change_password — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class ChangePasswordUserRequest(BaseSchema):
    """User change_password payload (camelCase over the wire)."""

    notes: str | None = None
