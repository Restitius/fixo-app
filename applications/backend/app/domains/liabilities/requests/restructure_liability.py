"""Liability restructure — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class RestructureLiabilityRequest(BaseSchema):
    """Liability restructure payload (camelCase over the wire)."""

    notes: str | None = None
