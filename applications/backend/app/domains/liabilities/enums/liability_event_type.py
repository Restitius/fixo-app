"""Liability audit/event taxonomy enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class LiabilityEventType(str, Enum):

    CREATED = "CREATED"
    UPDATED = "UPDATED"
    SETTLED = "SETTLED"
    RESTRUCTURED = "RESTRUCTURED"
