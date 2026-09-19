"""Token kind enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class Tokenkind(str, Enum):

    ACCESS = "ACCESS"
    REFRESH = "REFRESH"
