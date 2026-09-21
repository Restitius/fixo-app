"""Authentication refresh — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class RefreshAuthenticationRequest(BaseSchema):
    """Authentication refresh payload (camelCase over the wire)."""

    notes: str | None = None
