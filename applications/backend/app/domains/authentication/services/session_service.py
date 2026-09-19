"""AuthenticationService — application service for credentials, tokens, sessions, lockout.

Flow: Controller -> DTO -> here -> Rules/Calculators -> QueryService ->
governed SQL -> Domain Events -> EventBus.
"""
from __future__ import annotations

from typing import Any

from app.api.deps.request_context import RequestContext


class AuthenticationService:
    def __init__(self, query_service: Any, event_bus: Any, integration_manager: Any) -> None:
        self._queries = query_service
        self._events = event_bus
        self._integrations = integration_manager


    async def login(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Login use case (rules -> persistence -> events)."""
        raise NotImplementedError("AuthenticationService.login")
    async def refresh(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Refresh use case (rules -> persistence -> events)."""
        raise NotImplementedError("AuthenticationService.refresh")
    async def logout(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """Logout use case (rules -> persistence -> events)."""
        raise NotImplementedError("AuthenticationService.logout")
    async def list_sessions(self, ctx: RequestContext, *args: Any, **kwargs: Any) -> Any:
        """List_sessions use case (rules -> persistence -> events)."""
        raise NotImplementedError("AuthenticationService.list_sessions")
