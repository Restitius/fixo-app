"""TransactionService — application service for financial transactions: recording, categorization, settlement.

Flow: Controller -> DTO -> here -> Rules/Calculators -> QueryService ->
governed SQL -> Domain Events -> EventBus.
"""
from __future__ import annotations

from typing import Any

from app.api.deps.request_context import RequestContext


class TransactionService:
    def __init__(self, query_service: Any, event_bus: Any, integration_manager: Any) -> None:
        self._queries = query_service
        self._events = event_bus
        self._integrations = integration_manager


    async def create(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Create use case (rules -> persistence -> events)."""
        raise NotImplementedError("TransactionService.create")
    async def update(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Update use case (rules -> persistence -> events)."""
        raise NotImplementedError("TransactionService.update")
    async def settle(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Settle use case (rules -> persistence -> events)."""
        raise NotImplementedError("TransactionService.settle")
    async def categorize(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Categorize use case (rules -> persistence -> events)."""
        raise NotImplementedError("TransactionService.categorize")
