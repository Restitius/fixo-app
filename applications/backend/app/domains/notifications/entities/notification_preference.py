"""NotificationPreference entity — Per-channel opt-in/out per recipient."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NotificationPreference:
    parent_id: int
    label: str
