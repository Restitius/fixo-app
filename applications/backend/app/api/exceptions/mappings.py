"""Error-code mappings — friendly titles/bodies per stable error code."""
from __future__ import annotations

DEFAULTS: dict[str, tuple[str, str]] = {
    "VALIDATION.FAILED": ("Validation Failed", "Please review the highlighted fields."),
    "AUTH.FAILED": ("Authentication Required", "Your session is invalid or expired."),
    "AUTHZ.DENIED": ("Not Permitted", "You do not have access to this action."),
    "AUTHZ.NOT_OWNER": ("Not Permitted", "This record belongs to another account."),
    "RESOURCE.NOT_FOUND": ("Not Found", "The requested record does not exist."),
    "RESOURCE.CONFLICT": ("Conflict", "The record is in a state that forbids this action."),
    "RATE.LIMITED": ("Slow Down", "Too many requests; please retry shortly."),
    "INTEGRATION.FAILED": ("External Service Error", "An external service failed; retry later."),
    "INTEGRATION.TIMEOUT": ("External Service Timeout", "The external service took too long."),
    "CONFIG.INVALID": ("Configuration Error", "The service is misconfigured; contact support."),
    "FEATURE.NOT_IMPLEMENTED": ("Not Implemented", "This capability is on the roadmap."),
}


def describe(code: str, fallback_body: str = "") -> tuple[str, str]:
    """Return (title, body) for an error code with sensible fallbacks."""
    title, body = DEFAULTS.get(code, ("Error", ""))
    return title, (fallback_body or body)
