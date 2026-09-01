"""Authentication logout — HTTP input validation schema."""
from __future__ import annotations

from decimal import Decimal
from datetime import date

from app.shared.schemas.base import BaseSchema


class LogoutAuthenticationRequest(BaseSchema):
    """Authentication logout payload (camelCase over the wire)."""

    notes: str | None = None
