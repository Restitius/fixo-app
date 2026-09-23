"""Standard response helpers — every endpoint returns these shapes."""
from __future__ import annotations

from typing import Any

from fastapi.responses import JSONResponse

from app.shared.responses.envelope import error_envelope, success_envelope


def _registered_message(message_id: str, params: dict[str, Any] | None) -> dict[str, Any]:
    from app.registries.messages.message_registry import get_message_registry

    return get_message_registry().get(message_id, params)


def ok(
    data: Any = None,
    *,
    title: str = "Success",
    body: str = "",
    meta: dict[str, Any] | None = None,
    request_id: str | None = None,
    status_code: int = 200,
    message_id: str | None = None,
    message_params: dict[str, Any] | None = None,
) -> JSONResponse:
    message = _registered_message(message_id, message_params) if message_id else None
    return JSONResponse(
        status_code=status_code,
        content=success_envelope(
            data=data,
            title=title,
            body=body,
            meta=meta,
            request_id=request_id,
            message=message,
        ),
    )


def created(
    data: Any = None,
    *,
    title: str = "Created",
    body: str = "",
    meta: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> JSONResponse:
    return ok(data, title=title, body=body, meta=meta, request_id=request_id, status_code=201)


def accepted(
    data: Any = None,
    *,
    title: str = "Accepted",
    body: str = "The work has been queued.",
    meta: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> JSONResponse:
    return ok(data, title=title, body=body, meta=meta, request_id=request_id, status_code=202)


def fail(
    status_code: int,
    code: str,
    *,
    title: str = "Error",
    body: str = "",
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
    message_id: str | None = None,
    message_params: dict[str, Any] | None = None,
) -> JSONResponse:
    message = _registered_message(message_id, message_params) if message_id else None
    return JSONResponse(
        status_code=status_code,
        content=error_envelope(
            code=code,
            title=title,
            body=body,
            details=details,
            request_id=request_id,
            message=message,
        ),
    )
