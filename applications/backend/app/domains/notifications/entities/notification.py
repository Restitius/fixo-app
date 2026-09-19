"""Notification entity — Rich domain object (not a database model). (section 27)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Notification:
    notification_id: int | None
    user_id: str
    status: str
    notes: str | None = None
