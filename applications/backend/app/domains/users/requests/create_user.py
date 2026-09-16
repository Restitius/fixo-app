"""User create — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class CreateUserRequest(BaseSchema):
    """User create payload (camelCase over the wire)."""

    name: str
    notes: str | None = None
