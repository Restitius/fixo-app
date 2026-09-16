"""Liability record_payment — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class RecordPaymentLiabilityRequest(BaseSchema):
    """Liability record_payment payload (camelCase over the wire)."""

    notes: str | None = None
