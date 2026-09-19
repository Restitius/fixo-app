"""Transaction settle — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class SettleTransactionRequest(BaseSchema):
    """Transaction settle payload (camelCase over the wire)."""

    notes: str | None = None
