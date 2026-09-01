"""RateLimitMiddleware — fixed/sliding window limiter (backend-pending).

Default budget comes from shared.constants.limits.RATE_LIMIT_DEFAULT; the
counter store (Redis/in-memory) plugs in during implementation.
"""
from __future__ import annotations


class RateLimitMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        # TODO(security): enforce RATE_LIMIT_DEFAULT per identity/IP via cache.
        await self.app(scope, receive, send)
