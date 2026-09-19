"""AuthorizationMiddleware — scaffold placeholder.

Permission checks run through api.deps.permissions per route today; this
hook reserves space for centralized policy evaluation.
"""
from __future__ import annotations


class AuthorizationMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        # TODO(security): centralized policy decision point.
        await self.app(scope, receive, send)
