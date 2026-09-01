"""Liability create — HTTP input validation schema."""
from __future__ import annotations

from decimal import Decimal
from datetime import date

from app.shared.schemas.base import BaseSchema


class CreateLiabilityRequest(BaseSchema):
    """Liability create payload (camelCase over the wire)."""

    name: str
    notes: str | None = None
