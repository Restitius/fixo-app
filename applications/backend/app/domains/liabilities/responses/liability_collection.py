"""LiabilityCollection — shapes MANY liability rows."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any


class LiabilityCollection:
    @staticmethod
    def to_resources(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
        raise NotImplementedError("LiabilityCollection.to_resources")
