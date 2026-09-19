"""AuthenticationDTO — internal transport for Authentication existing session (section 24)."""
from __future__ import annotations

from dataclasses import dataclass

from app.shared.dtos.base import BaseDTO


@dataclass
class AuthenticationDTO(BaseDTO):
    """existing session DTO moving between controller and service."""

    session_id: int
    user_id: str
    status: str
    notes: str | None = None
