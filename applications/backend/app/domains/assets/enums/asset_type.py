"""Asset classification enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class AssetType(str, Enum):

    REAL_ESTATE = "REAL_ESTATE"
    VEHICLE = "VEHICLE"
    EQUITY = "EQUITY"
    CRYPTO = "CRYPTO"
    EQUIPMENT = "EQUIPMENT"
    OTHER = "OTHER"
