"""Application exception hierarchy.

Every exception carries a stable error code, HTTP status and optional details
so 'api/exceptions/handlers.py' can render the standard envelope uniformly.
Logging stays silent here; middleware/logging owns observability.
"""
from __future__ import annotations

from typing import Any


class AppException(Exception):
    """Base class for all expected application errors."""

    default_code: str = "APP.ERROR"
    http_status: int = 500

    def __init__(
        self,
        message: str = "",
        *,
        code: str | None = None,
        details: dict[str, Any] | None = None,
        http_status: int | None = None,
    ) -> None:
        super().__init__(message or self.default_code)
        self.message = message or self.default_code
        self.code = code or self.default_code
        self.details: dict[str, Any] = details or {}
        self.http_status = http_status or self.http_status


class ValidationError(AppException):
    """Input failed validation (maps to HTTP 422)."""

    default_code = "VALIDATION.FAILED"
    http_status = 422


class AuthenticationError(AppException):
    """Credentials missing/invalid/expired (HTTP 401)."""

    default_code = "AUTH.FAILED"
    http_status = 401


class AuthorizationError(AppException):
    """Authenticated but not permitted (HTTP 403)."""

    default_code = "AUTHZ.DENIED"
    http_status = 403


class NotFoundError(AppException):
    """Requested resource does not exist (HTTP 404)."""

    default_code = "RESOURCE.NOT_FOUND"
    http_status = 404


class ConflictError(AppException):
    """State conflict, e.g. selling an already-sold asset (HTTP 409)."""

    default_code = "RESOURCE.CONFLICT"
    http_status = 409


class RateLimitError(AppException):
    """Too many requests (HTTP 429)."""

    default_code = "RATE.LIMITED"
    http_status = 429


class IntegrationError(AppException):
    """An external integration failed (HTTP 502)."""

    default_code = "INTEGRATION.FAILED"
    http_status = 502


class ExternalTimeoutError(IntegrationError):
    """External system did not respond in time."""

    default_code = "INTEGRATION.TIMEOUT"
    http_status = 504


class ConfigurationError(AppException):
    """Startup/configuration problem (HTTP 500, operator action needed)."""

    default_code = "CONFIG.INVALID"
    http_status = 500


class NotImplementedFeatureError(AppException):
    """Scaffold placeholder: feature declared but not yet implemented (HTTP 501)."""

    default_code = "FEATURE.NOT_IMPLEMENTED"
    http_status = 501
