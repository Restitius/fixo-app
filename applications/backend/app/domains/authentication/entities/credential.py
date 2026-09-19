"""Credential entity — Login identity: username/email + password hash + lockout state. (section 27)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Credential:
    session_id: int | None
    user_id: str
    status: str
    notes: str | None = None
