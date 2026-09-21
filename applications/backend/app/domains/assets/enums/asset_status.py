"""Asset lifecycle status enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class AssetStatus(str, Enum):

    ACTIVE = "ACTIVE"
    SOLD = "SOLD"
    ARCHIVED = "ARCHIVED"
