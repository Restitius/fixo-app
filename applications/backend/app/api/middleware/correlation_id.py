"""CorrelationIdMiddleware — propagate or mint the COR-* correlation id.

The SAME value must appear across API/service/query/event/integration/
notification logs (section 22) so one search reconstructs a transaction.
"""
from __future__ import annotations

from app.logging.context import bind
from app.shared.constants.headers import HEADER_CORRELATION_ID
from app.shared.helpers.identifiers import new_correlation_id


class CorrelationIdMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        incoming = ""
        for raw_key, raw_value in scope.get("headers", []):
            if raw_key.decode("latin-1").lower() == HEADER_CORRELATION_ID.lower():
                incoming = raw_value.decode("latin-1")
                break
        correlation_id = incoming or new_correlation_id()

        bind(correlation_id=correlation_id)
        scope.setdefault("state", {})["correlation_id"] = correlation_id

        async def send_wrapper(message) -> None:  # type: ignore[no-untyped-def]
            if message["type"] == "http.response.start":
                headers = message.setdefault("headers", [])
                headers.append((HEADER_CORRELATION_ID.lower().encode(), correlation_id.encode()))
            await send(message)

        await self.app(scope, receive, send_wrapper)
