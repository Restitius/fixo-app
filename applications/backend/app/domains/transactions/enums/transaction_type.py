"""Transaction classification enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class Transactionclassification(str, Enum):

    CREDIT = "CREDIT"
    DEBIT = "DEBIT"
