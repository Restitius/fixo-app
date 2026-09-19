"""RequestContext dependency — one object carrying full traceability.

Fields mirror architecture section 10/22:
request_id, correlation_id, user_id, session_id, screen_id, tenant_id,
client_ip, method, path.
"""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Request


@dataclass(frozen=True)
class RequestContext:
    request_id: str
    correlation_id: str
    user_id: str
    session_id: str
    screen_id: str
    tenant_id: str
    client_ip: str
    method: str
    path: str
    client_id: str = ""
    client_kind: str = ""
    client_family: str = ""
    client_version: str = ""


def _state_get(request: Request, key: str, default: str = "") -> str:
    value = getattr(request.state, key, default)
    return str(value) if value is not None else default


async def get_request_context(request: Request) -> RequestContext:
    """Assemble the context from middleware-populated state (+fallbacks)."""
    screen_ctx = getattr(request.state, "screen_context", None)
    client_ctx = getattr(request.state, "client_context", None)
    return RequestContext(
        request_id=_state_get(request, "request_id"),
        correlation_id=_state_get(request, "correlation_id"),
        user_id=_state_get(request, "user_id"),
        session_id=_state_get(request, "session_id"),
        screen_id=screen_ctx.screen_id if screen_ctx else "",
        tenant_id=_state_get(request, "tenant_id"),
        client_ip=request.client.host if request.client else "",
        method=request.method,
        path=request.url.path,
        client_id=client_ctx.client_id if client_ctx else "",
        client_kind=client_ctx.kind if client_ctx else "",
        client_family=client_ctx.family if client_ctx else "",
        client_version=client_ctx.version if client_ctx else "",
    )


# Re-exported for convenience in controller signatures.
from fastapi import Depends  # noqa: E402

RequestContextDep = RequestContext
GetRequestContext = Depends(get_request_context)
