"""UpdateAuthenticationDTO — internal transport for Authentication update input (section 24)."""
from __future__ import annotations

from dataclasses import dataclass

from app.shared.dtos.base import BaseDTO


@dataclass
class UpdateAuthenticationDTO(BaseDTO):
    """update input DTO moving between controller and service."""

    session_id: int
    user_id: str
    notes: str | None = None
