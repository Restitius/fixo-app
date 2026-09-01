"""Asset audit/event taxonomy enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class AssetEventType(str, Enum):

    CREATED = "CREATED"
    UPDATED = "UPDATED"
    SOLD = "SOLD"
    REVALUED = "REVALUED"
    ARCHIVED = "ARCHIVED"
