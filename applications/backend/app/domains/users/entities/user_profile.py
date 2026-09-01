"""UserProfile entity — Display name, avatar, preferences pointer."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class UserProfile:
    parent_id: int
    label: str
