"""LiabilityService — application service for debts: schedules, interest, repayments, restructuring.

Flow: Controller -> DTO -> here -> Rules/Calculators -> QueryService ->
governed SQL -> Domain Events -> EventBus.
"""
from __future__ import annotations

from typing import Any

from app.api.deps.request_context import RequestContext


class LiabilityService:
    def __init__(self, query_service: Any, event_bus: Any, integration_manager: Any) -> None:
        self._queries = query_service
        self._events = event_bus
        self._integrations = integration_manager


    async def create(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Create use case (rules -> persistence -> events)."""
        raise NotImplementedError("LiabilityService.create")
    async def update(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Update use case (rules -> persistence -> events)."""
        raise NotImplementedError("LiabilityService.update")
    async def restructure(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Restructure use case (rules -> persistence -> events)."""
        raise NotImplementedError("LiabilityService.restructure")
    async def record_payment(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Record_payment use case (rules -> persistence -> events)."""
        raise NotImplementedError("LiabilityService.record_payment")
