"""Request-scoped logging context via contextvars (sections 21-22).

The SAME correlation_id must appear in API/service/query/event/integration/
notification logs so any single value reconstructs the whole transaction.
"""
from __future__ import annotations

import contextvars

_request_id: contextvars.ContextVar[str] = contextvars.ContextVar("log_request_id", default="")
_correlation_id: contextvars.ContextVar[str] = contextvars.ContextVar("log_correlation_id", default="")
_user_id: contextvars.ContextVar[str] = contextvars.ContextVar("log_user_id", default="")
_session_id: contextvars.ContextVar[str] = contextvars.ContextVar("log_session_id", default="")
_screen_id: contextvars.ContextVar[str] = contextvars.ContextVar("log_screen_id", default="")
_tenant_id: contextvars.ContextVar[str] = contextvars.ContextVar("log_tenant_id", default="")
_client_ip: contextvars.ContextVar[str] = contextvars.ContextVar("log_client_ip", default="")
_trace_id: contextvars.ContextVar[str] = contextvars.ContextVar("log_trace_id", default="")


def bind(**values: str) -> None:
    """Set any subset of the context fields for the current task/request."""
    mapping = {
        "request_id": _request_id,
        "correlation_id": _correlation_id,
        "user_id": _user_id,
        "session_id": _session_id,
        "screen_id": _screen_id,
        "tenant_id": _tenant_id,
        "client_ip": _client_ip,
        "trace_id": _trace_id,
    }
    for name, var in mapping.items():
        if name in values and values[name] is not None:
            var.set(str(values[name]))


def current() -> dict[str, str]:
    """Snapshot of non-empty context values."""
    return {
        "request_id": _request_id.get(),
        "correlation_id": _correlation_id.get(),
        "user_id": _user_id.get(),
        "session_id": _session_id.get(),
        "screen_id": _screen_id.get(),
        "tenant_id": _tenant_id.get(),
        "client_ip": _client_ip.get(),
        "trace_id": _trace_id.get(),
    }


def clear() -> None:
    """Reset every field (end of request/task)."""
    for var in (_request_id, _correlation_id, _user_id, _session_id,
                _screen_id, _tenant_id, _client_ip, _trace_id):
        var.set("")
