"""LoggingMiddleware — structured access log with duration + traceability."""
from __future__ import annotations

import logging
import time

from app.logging.context import bind

logger = logging.getLogger("api.access")


class LoggingMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "")
        path = scope.get("path", "")
        bind(method=method, path=path)
        started = time.perf_counter()
        status_holder = {"status": 0}

        async def send_wrapper(message) -> None:  # type: ignore[no-untyped-def]
            if message["type"] == "http.response.start":
                status_holder["status"] = message.get("status", 0)
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            elapsed_ms = (time.perf_counter() - started) * 1000
            logger.info(
                "%s %s -> %s %.1fms",
                method,
                path,
                status_holder["status"] or "-",
                elapsed_ms,
            )
