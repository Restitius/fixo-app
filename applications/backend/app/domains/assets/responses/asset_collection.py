"""AssetCollection — shapes MANY assets (resource list + meta hooks)."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any


class AssetCollection:
    @staticmethod
    def to_resources(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
        """Map many rows through AssetResource.to_resource."""
        raise NotImplementedError("AssetCollection.to_resources")
