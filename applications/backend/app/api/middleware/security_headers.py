"""SecurityHeadersMiddleware — standard hardening headers on every API response.

Added alongside the CI/CD security handbook's response-header test
(applications/backend/tests/security/test_response_headers.py) — none of
these were previously set, confirmed by inspecting a real response
before adding this file.
"""
from __future__ import annotations

_SECURITY_HEADERS = (
    (b"strict-transport-security", b"max-age=31536000; includeSubDomains"),
    (b"x-content-type-options", b"nosniff"),
    (b"x-frame-options", b"DENY"),
    (b"referrer-policy", b"strict-origin-when-cross-origin"),
    (b"cache-control", b"no-store"),
)


class SecurityHeadersMiddleware:
    """Pure-ASGI: no business logic, only response header hardening."""

    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message) -> None:  # type: ignore[no-untyped-def]
            if message["type"] == "http.response.start":
                headers = message.setdefault("headers", [])
                headers.extend(_SECURITY_HEADERS)
            await send(message)

        await self.app(scope, receive, send_wrapper)
