"""Transaction create — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class CreateTransactionRequest(BaseSchema):
    """Transaction create payload (camelCase over the wire)."""

    name: str
    notes: str | None = None
