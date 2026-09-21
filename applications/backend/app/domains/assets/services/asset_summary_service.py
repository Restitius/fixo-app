"""AssetSummaryService — read-model assembly for dashboards (SCR-AST-001)."""
from __future__ import annotations

from typing import Any


class AssetSummaryService:
    def __init__(self, query_service: Any, cache_manager: Any) -> None:
        self._queries = query_service
        self._cache = cache_manager

    async def summary_for(self, user_id: str) -> dict:
        """Cache-wrapped ASSET.SUMMARY aggregation."""
        raise NotImplementedError("AssetSummaryService.summary_for")
