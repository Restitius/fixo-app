"""Identifier generators (pure) — request/correlation/event/job run IDs."""
from __future__ import annotations

import uuid


def short_token(length: int = 12) -> str:
    """Lowercase hex token of the requested length."""
    return uuid.uuid4().hex[:length]


def new_request_id() -> str:
    return f"req-{short_token(12)}"


def new_correlation_id() -> str:
    return f"COR-{uuid.uuid4().hex[:8].upper()}"


def new_event_id(prefix: str = "EVT") -> str:
    return f"{prefix}-{short_token(12)}"


def new_job_run_id() -> str:
    return f"jobrun-{short_token(12)}"


def new_session_id() -> str:
    return f"ses-{short_token(16)}"
