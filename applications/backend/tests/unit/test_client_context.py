"""ClientContextMiddleware tests — header resolution, fallbacks, log binding."""
from __future__ import annotations

import pytest

from app.api.middleware.client_context import ClientContextMiddleware
from app.logging.context import clear as clear_log_context
from app.logging.context import current as log_context


class _Recorder:
    def __init__(self) -> None:
        self.scope = None

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        self.scope = scope


def _scope(path: str = "/api/v1/bookings", headers: list[tuple[bytes, bytes]] | None = None) -> dict:
    return {"type": "http", "path": path, "method": "GET", "headers": headers or [], "state": {}}


async def test_known_client_header_resolved_into_state():
    recorder = _Recorder()
    middleware = ClientContextMiddleware(recorder)
    await middleware(
        _scope(headers=[(b"x-client-id", b"CLT-WEB-PROVIDER"), (b"x-client-version", b"2.0.1")]),
        None,
        None,
    )
    ctx = recorder.scope["state"]["client_context"]
    assert ctx.client_id == "CLT-WEB-PROVIDER"
    assert ctx.kind == "web"
    assert ctx.version == "2.0.1"
    assert log_context()["client_id"] == "CLT-WEB-PROVIDER"
    assert log_context()["client_kind"] == "web"
    assert log_context()["client_family"] == "provider"
    assert log_context()["client_version"] == "2.0.1"
    clear_log_context()


async def test_unknown_header_falls_back_to_clt_unknown():
    recorder = _Recorder()
    middleware = ClientContextMiddleware(recorder)
    await middleware(_scope(headers=[(b"x-client-id", b"CLT-HACKED")]), None, None)
    ctx = recorder.scope["state"]["client_context"]
    assert ctx.client_id == "CLT-UNKNOWN"
    assert ctx.kind == "unknown"
    clear_log_context()


async def test_internal_path_inferred_without_header():
    recorder = _Recorder()
    middleware = ClientContextMiddleware(recorder)
    await middleware(_scope(path="/api/v1/internal/jobs/run", headers=[]), None, None)
    assert recorder.scope["state"]["client_context"].client_id == "CLT-INTERNAL"
    clear_log_context()


async def test_browser_user_agent_without_header_infers_web_unknown():
    recorder = _Recorder()
    middleware = ClientContextMiddleware(recorder)
    await middleware(
        _scope(headers=[(b"user-agent", b"Mozilla/5.0 (Windows NT 10.0; Win64; x64)")]),
        None,
        None,
    )
    assert recorder.scope["state"]["client_context"].client_id == "CLT-WEB-UNKNOWN"
    clear_log_context()


async def test_no_header_and_no_ua_falls_back_to_unknown():
    recorder = _Recorder()
    middleware = ClientContextMiddleware(recorder)
    await middleware(_scope(), None, None)
    assert recorder.scope["state"]["client_context"].client_id == "CLT-UNKNOWN"
    clear_log_context()


def test_infer_fallback_helpers():
    assert ClientContextMiddleware._infer_fallback_id("/api/v1/internal/x", "") == "CLT-INTERNAL"
    assert ClientContextMiddleware._infer_fallback_id("/api/v1/bookings", "Mozilla/5.0") == "CLT-WEB-UNKNOWN"
    assert ClientContextMiddleware._infer_fallback_id("/api/v1/bookings", "") == "CLT-UNKNOWN"


@pytest.mark.anyio
async def test_imports_app_factory():
    """Smoke: the app assembles with the new middleware wired in."""
    from app.startup.application import create_application

    app = create_application()
    assert app is not None