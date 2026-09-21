"""Delivery priority enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class Deliverypriority(str, Enum):

    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
