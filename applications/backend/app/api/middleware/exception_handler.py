"""ExceptionHandlingMiddleware — ASGI-level safety net rendering envelopes.

Route-level errors are handled by api.exceptions.handlers (registered on the
FastAPI app). This middleware covers errors raised OUTSIDE routing (other
middleware, protocol anomalies) so clients never see raw tracebacks.
"""
from __future__ import annotations

import logging

from app.shared.exceptions.hierarchy import AppException
from app.shared.responses.envelope import error_envelope

logger = logging.getLogger(__name__)

_STATUS_PHRASES = {
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
    409: "Conflict", 422: "Unprocessable Entity", 429: "Too Many Requests",
    500: "Internal Server Error", 501: "Not Implemented", 502: "Bad Gateway",
    504: "Gateway Timeout",
}


class ExceptionHandlingMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        try:
            await self.app(scope, receive, send)
        except AppException as exc:
            logger.warning("asgi-level AppException: %s", exc.code)
            await self._send_error(send, exc.http_status, exc.code, exc.message, exc.details)
        except NotImplementedError as exc:
            logger.warning("asgi-level unimplemented feature: %s", exc)
            await self._send_error(send, 501, "FEATURE.NOT_IMPLEMENTED", str(exc), {})
        # All other exceptions propagate to the server error handler.

    async def _send_error(self, send, status: int, code: str, message: str, details: dict) -> None:  # type: ignore[no-untyped-def]
        import json

        payload = error_envelope(
            code=code,
            title=_STATUS_PHRASES.get(status, "Error"),
            body=message,
            details=details,
        )
        body = json.dumps(payload).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": status,
                "headers": [(b"content-type", b"application/json")],
            }
        )
        await send({"type": "http.response.body", "body": body})
