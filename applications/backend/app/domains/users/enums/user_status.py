"""User lifecycle status enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class UserStatus(str, Enum):

    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"
