"""AssetActivityResource — valuation/activity history item shape."""
from __future__ import annotations

from typing import Any


class AssetActivityResource:
    @staticmethod
    def to_resource(activity_row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("AssetActivityResource.to_resource")
