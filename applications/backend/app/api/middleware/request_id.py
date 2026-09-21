"""RequestIdMiddleware — assigns req-* id, binds log context, echoes header."""
from __future__ import annotations

from app.logging.context import bind
from app.shared.constants.headers import HEADER_REQUEST_ID
from app.shared.helpers.identifiers import new_request_id


class RequestIdMiddleware:
    """Pure-ASGI: no business logic, only identity plumbing."""

    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = new_request_id()
        bind(request_id=request_id)
        scope.setdefault("state", {})["request_id"] = request_id

        async def send_wrapper(message) -> None:  # type: ignore[no-untyped-def]
            if message["type"] == "http.response.start":
                headers = message.setdefault("headers", [])
                headers.append((HEADER_REQUEST_ID.lower().encode(), request_id.encode()))
            await send(message)

        await self.app(scope, receive, send_wrapper)
