"""AuditMiddleware — scaffold placeholder for request-level audit trails.

Design: after response, persist an AuditEvent for mutating verbs (POST/PATCH/
PUT/DELETE) using RequestContext + screen context; bodies excluded, diffs come
from services.
"""
from __future__ import annotations


class AuditMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        # TODO(audit): record mutating-request audit entries post-response.
        await self.app(scope, receive, send)
