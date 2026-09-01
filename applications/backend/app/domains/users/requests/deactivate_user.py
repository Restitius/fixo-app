"""User deactivate — HTTP input validation schema."""
from __future__ import annotations

from decimal import Decimal
from datetime import date

from app.shared.schemas.base import BaseSchema


class DeactivateUserRequest(BaseSchema):
    """User deactivate payload (camelCase over the wire)."""

    notes: str | None = None
