"""AssetSummaryResource — portfolio totals representation."""
from __future__ import annotations

from typing import Any


class AssetSummaryResource:
    @staticmethod
    def to_resource(summary_rows: list[dict[str, Any]]) -> dict[str, Any]:
        """Aggregate ASSET.SUMMARY rows into a client-friendly summary."""
        raise NotImplementedError("AssetSummaryResource.to_resource")
