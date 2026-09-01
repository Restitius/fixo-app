"""Operational limits and defaults."""
from __future__ import annotations

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
DEFAULT_QUERY_TIMEOUT_MS = 5_000
RATE_LIMIT_DEFAULT = "120/minute"
MAX_BODY_BYTES = 10 * 1024 * 1024
