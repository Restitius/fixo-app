"""Liability lifecycle status enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class LiabilityStatus(str, Enum):

    ACTIVE = "ACTIVE"
    SETTLED = "SETTLED"
    DEFAULTED = "DEFAULTED"
    ARCHIVED = "ARCHIVED"
