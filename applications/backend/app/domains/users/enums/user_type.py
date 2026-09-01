"""Role assignment enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class Roleassignment(str, Enum):

    MEMBER = "MEMBER"
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"
