"""Transaction categorize — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class CategorizeTransactionRequest(BaseSchema):
    """Transaction categorize payload (camelCase over the wire)."""

    notes: str | None = None
