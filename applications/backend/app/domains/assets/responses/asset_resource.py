"""AssetResource — shapes ONE asset row for the API (Laravel-resource style)."""
from __future__ import annotations

from typing import Any


class AssetResource:
    """Database row / DTO -> public JSON contract. Never leaks internals."""

    @staticmethod
    def to_resource(row: dict[str, Any]) -> dict[str, Any]:
        """Map a governed-query row to the public asset representation."""
        raise NotImplementedError("AssetResource.to_resource")
