"""TransactionSummaryService — read-model assembly for list screens."""
from __future__ import annotations

from typing import Any


class TransactionSummaryService:
    def __init__(self, query_service: Any, cache_manager: Any) -> None:
        self._queries = query_service
        self._cache = cache_manager

    async def summary_for(self, user_id: str) -> dict:
        raise NotImplementedError("TransactionSummaryService.summary_for")
