"""Job/async origin helper — snapshot shell + trace origin for background work.

A job enqueued from a request should remember *which frontend shell* it was
triggered from so ops can answer "web-user, web-provider, mobile, or internal"
when auditing a JOB-* run. Pure snapshot: no IO, no imports that could cycle.
"""
from __future__ import annotations

from app.logging.context import current


def capture_origin() -> dict[str, str]:
    """Snapshot the current request's origin attributes (JSON-safe)."""
    ctx = current()
    return {
        "client_id": ctx.get("client_id", ""),
        "client_version": ctx.get("client_version", ""),
        "screen_id": ctx.get("screen_id", ""),
        "correlation_id": ctx.get("correlation_id", ""),
        "user_id": ctx.get("user_id", ""),
        "session_id": ctx.get("session_id", ""),
    }