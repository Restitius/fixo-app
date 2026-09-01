"""NotificationWorkflowService — multi-step stateful workflows."""
from __future__ import annotations

from typing import Any


class NotificationWorkflowService:
    def __init__(self, query_service: Any, rules: Any) -> None:
        self._queries = query_service
        self._rules = rules

    async def advance(self, user_id: str, entity_id: int, target_state: str) -> dict:
        """Guarded state-machine transition (rules checked first)."""
        raise NotImplementedError("NotificationWorkflowService.advance")
