"""Transaction update — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class UpdateTransactionRequest(BaseSchema):
    """Transaction update payload (camelCase over the wire)."""

    notes: str | None = None
