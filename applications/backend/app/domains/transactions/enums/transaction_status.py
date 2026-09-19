"""Transaction lifecycle status enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class TransactionStatus(str, Enum):

    PENDING = "PENDING"
    SETTLED = "SETTLED"
    FAILED = "FAILED"
    ARCHIVED = "ARCHIVED"
