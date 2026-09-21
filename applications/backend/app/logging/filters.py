"""ContextFilter — stamps every LogRecord with request-context fields."""
from __future__ import annotations

import logging

from app.logging.context import current

_CONTEXT_FIELDS = (
    "request_id", "correlation_id", "user_id", "session_id",
    "screen_id", "tenant_id", "client_ip", "trace_id",
)


class ContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        snapshot = current()
        for field_name in _CONTEXT_FIELDS:
            setattr(record, field_name, snapshot.get(field_name, "") or "-")
        return True
