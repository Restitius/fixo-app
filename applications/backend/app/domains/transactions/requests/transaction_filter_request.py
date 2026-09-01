"""Transaction filter hints — HTTP input validation schema."""
from __future__ import annotations

from decimal import Decimal
from datetime import date

from app.shared.schemas.base import BaseSchema


class TransactionFilterRequest(BaseSchema):
    """Transaction filter hints payload (camelCase over the wire)."""

    search: str | None = None
    status: str | None = None
