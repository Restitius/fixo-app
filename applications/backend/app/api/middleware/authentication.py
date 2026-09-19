"""AuthenticationMiddleware — scaffold placeholder.

Enforcement currently happens in api.deps.auth (route-level). This ASGI hook
exists for future scheme negotiation (e.g. API keys for webhooks).
"""
from __future__ import annotations


class AuthenticationMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        # TODO(security): pre-route token introspection / scheme selection.
        await self.app(scope, receive, send)
