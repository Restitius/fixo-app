"""Error response shortcuts shared by controllers and handlers."""
from __future__ import annotations

from typing import Any

from fastapi.responses import JSONResponse

from app.api.responses.response import fail


def not_found(resource: str, resource_id: str = "", *, request_id: str | None = None) -> JSONResponse:
    body = f"{resource} not found." + (f" (id={resource_id})" if resource_id else "")
    return fail(404, "RESOURCE.NOT_FOUND", title="Not Found", body=body, request_id=request_id)


def conflict(message: str, *, request_id: str | None = None) -> JSONResponse:
    return fail(409, "RESOURCE.CONFLICT", title="Conflict", body=message, request_id=request_id)


def forbidden(message: str = "You do not have access to this action.", *, request_id: str | None = None) -> JSONResponse:
    return fail(403, "AUTHZ.DENIED", title="Not Permitted", body=message, request_id=request_id)


def validation_failed(details: dict[str, Any] | None = None, *, request_id: str | None = None) -> JSONResponse:
    return fail(422, "VALIDATION.FAILED", title="Validation Failed", body="Please review the highlighted fields.", details=details, request_id=request_id)
