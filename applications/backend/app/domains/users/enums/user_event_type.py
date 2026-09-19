"""User audit/event taxonomy enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class UserEventType(str, Enum):

    CREATED = "CREATED"
    UPDATED = "UPDATED"
    DEACTIVATED = "DEACTIVATED"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
