"""NotificationService — application service for persistent notifications, preferences, delivery state.

Flow: Controller -> DTO -> here -> Rules/Calculators -> QueryService ->
governed SQL -> Domain Events -> EventBus.
"""
from __future__ import annotations

from typing import Any

from app.api.deps.request_context import RequestContext


class NotificationService:
    def __init__(self, query_service: Any, event_bus: Any, integration_manager: Any) -> None:
        self._queries = query_service
        self._events = event_bus
        self._integrations = integration_manager


    async def list_notifications(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """List_notifications use case (rules -> persistence -> events)."""
        raise NotImplementedError("NotificationService.list_notifications")
    async def mark_read(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Mark_read use case (rules -> persistence -> events)."""
        raise NotImplementedError("NotificationService.mark_read")
    async def dismiss(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Dismiss use case (rules -> persistence -> events)."""
        raise NotImplementedError("NotificationService.dismiss")
    async def update_preferences(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Update_preferences use case (rules -> persistence -> events)."""
        raise NotImplementedError("NotificationService.update_preferences")
