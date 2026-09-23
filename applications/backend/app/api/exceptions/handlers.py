"""Exception handlers — render EVERY error in the standard envelope."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.exceptions.mappings import describe
from app.shared.exceptions.hierarchy import AppException
from app.shared.responses.envelope import error_envelope

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def _message_for_error(request: Request, code: str) -> dict | None:
    """Map stable API errors to registered display copy without leaking exception text."""
    message_id: str | None = None
    if code == "AUTH.FAILED":
        if request.url.path.endswith("/login"):
            message_id = "MSG.AUTH.LOGIN.INVALID_CREDENTIALS.V1"
        elif request.url.path.endswith("/otp/verify"):
            message_id = "MSG.AUTH.OTP.INVALID.V1"
        else:
            message_id = "MSG.AUTH.SESSION.EXPIRED.V1"
    if message_id is None:
        return None
    from app.registries.messages.message_registry import get_message_registry

    return get_message_registry().get(message_id)


def register_exception_handlers(app: FastAPI) -> None:
    """Attach handlers for AppException, NotImplementedError, validation, 500."""

    @app.exception_handler(AppException)
    async def handle_app_exception(request: Request, exc: AppException) -> JSONResponse:
        title, body = describe(exc.code, exc.message)
        message = _message_for_error(request, exc.code)
        return JSONResponse(
            status_code=exc.http_status,
            content=error_envelope(
                code=exc.code,
                title=title,
                body=body,
                details=exc.details,
                request_id=_request_id(request),
                message=message,
            ),
        )

    @app.exception_handler(ValueError)
    async def handle_value_error(request: Request, exc: ValueError) -> JSONResponse:
        # Business-rule rejections from domain services (e.g. overdraft guard).
        return JSONResponse(
            status_code=422,
            content=error_envelope(
                code="BUSINESS.RULE_REJECTED",
                title="Request Rejected",
                body=str(exc) or "The request violates a business rule.",
                request_id=_request_id(request),
            ),
        )

    @app.exception_handler(NotImplementedError)
    async def handle_not_implemented(request: Request, exc: NotImplementedError) -> JSONResponse:
        return JSONResponse(
            status_code=501,
            content=error_envelope(
                code="FEATURE.NOT_IMPLEMENTED",
                title="Not Implemented",
                body=str(exc) or "Feature declared but not implemented yet.",
                request_id=_request_id(request),
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_envelope(
                code="VALIDATION.FAILED",
                title="Validation Failed",
                body="One or more fields failed validation.",
                details={"errors": exc.errors()},
                request_id=_request_id(request),
            ),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content=error_envelope(
                code="APP.ERROR",
                title="Internal Server Error",
                body="An unexpected error occurred.",
                request_id=_request_id(request),
            ),
        )
