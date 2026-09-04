"""ClientContextMiddleware — resolve X-Client-ID / X-Client-Version into request state.

Attribution only (never authorization): every request is tagged with the
frontend shell that originated it so logs, events, audit and jobs can answer
"which application did this?". Unknown/missing headers fall back gracefully so
no client is ever rejected — enforcement stays with RBAC + ownership rules.

Flow (mirrors ScreenTrackingMiddleware):

    Request(X-Client-ID) --> here --> ClientTracker --> ClientContext
                           --> request.state.client_context + log binding
"""
from __future__ import annotations

from functools import lru_cache

from app.clients.tracker import ClientTracker
from app.logging.context import bind
from app.registries.clients.client_registry import ClientRegistry
from app.shared.constants.headers import HEADER_CLIENT_ID, HEADER_CLIENT_VERSION


@lru_cache(maxsize=1)
def _default_client_registry() -> ClientRegistry:
    """Standalone registry populated from definitions (bootstrap shares it)."""
    from app.startup.register_clients import register_clients

    registry = ClientRegistry()
    register_clients(registry)
    return registry


class ClientContextMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        client_id = ""
        client_version = ""
        user_agent = ""
        path = scope.get("path", "")
        for raw_key, raw_value in scope.get("headers", []):
            key = raw_key.decode("latin-1").lower()
            if key == HEADER_CLIENT_ID.lower():
                client_id = raw_value.decode("latin-1")
            elif key == HEADER_CLIENT_VERSION.lower():
                client_version = raw_value.decode("latin-1")
            elif key == "user-agent":
                user_agent = raw_value.decode("latin-1")

        resolved_id = client_id or self._infer_fallback_id(path, user_agent)

        tracker = ClientTracker(_default_client_registry())
        client_context = tracker.resolve(resolved_id, client_version)
        bind(
            client_id=client_context.client_id,
            client_kind=client_context.kind,
            client_family=client_context.family,
            client_version=client_context.version,
        )
        scope.setdefault("state", {})["client_context"] = client_context

        await self.app(scope, receive, send)

    @staticmethod
    def _infer_fallback_id(path: str, user_agent: str) -> str:
        """Best-effort classification when X-Client-ID is absent."""
        if path.startswith("/internal") or path.startswith("/api/v1/internal"):
            return "CLT-INTERNAL"
        if user_agent and not user_agent.lower().startswith(("curl", "wget", "httpie")):
            return "CLT-WEB-UNKNOWN"
        return "CLT-UNKNOWN"