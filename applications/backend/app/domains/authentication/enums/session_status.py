"""Authentication lifecycle status enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class SessionStatus(str, Enum):

    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
