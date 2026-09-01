"""Authentication filter hints — HTTP input validation schema."""
from __future__ import annotations

from decimal import Decimal
from datetime import date

from app.shared.schemas.base import BaseSchema


class AuthenticationFilterRequest(BaseSchema):
    """Authentication filter hints payload (camelCase over the wire)."""

    search: str | None = None
    status: str | None = None
