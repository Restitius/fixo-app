"""Authentication login — HTTP input validation schema."""
from __future__ import annotations

from app.shared.schemas.base import BaseSchema


class LoginAuthenticationRequest(BaseSchema):
    """Authentication login payload (camelCase over the wire)."""

    name: str
    notes: str | None = None
