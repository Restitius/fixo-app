"""LiabilityResource — shapes ONE liability row for the API."""
from __future__ import annotations

from typing import Any


class LiabilityResource:
    @staticmethod
    def to_resource(row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("LiabilityResource.to_resource")
