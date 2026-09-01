"""UserService — application service for user profiles, preferences, account lifecycle.

Flow: Controller -> DTO -> here -> Rules/Calculators -> QueryService ->
governed SQL -> Domain Events -> EventBus.
"""
from __future__ import annotations

from typing import Any

from app.api.deps.request_context import RequestContext


class UserService:
    def __init__(self, query_service: Any, event_bus: Any, integration_manager: Any) -> None:
        self._queries = query_service
        self._events = event_bus
        self._integrations = integration_manager


    async def create(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Create use case (rules -> persistence -> events)."""
        raise NotImplementedError("UserService.create")
    async def update(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Update use case (rules -> persistence -> events)."""
        raise NotImplementedError("UserService.update")
    async def change_password(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Change_password use case (rules -> persistence -> events)."""
        raise NotImplementedError("UserService.change_password")
    async def deactivate(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Deactivate use case (rules -> persistence -> events)."""
        raise NotImplementedError("UserService.deactivate")
