"""Liability classification enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class Liabilityclassification(str, Enum):

    LOAN = "LOAN"
    CREDIT_CARD = "CREDIT_CARD"
    MORTGAGE = "MORTGAGE"
    OTHER = "OTHER"
