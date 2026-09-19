"""AuthSession entity — One authenticated device/session binding."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AuthSession:
    parent_id: int
    label: str
