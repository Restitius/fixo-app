"""ContextFormatter — human-readable lines carrying traceability suffix.

Example output::

    2026-08-24 11:45:03 INFO api.access GET /api/v1/assets 200 12ms | req=req-8120 cor=COR-872991 usr=1043 scr=SCR-AST-001
"""
from __future__ import annotations

import logging

_DEFAULT_FORMAT = "%(asctime)s %(levelname)-8s %(name)s %(message)s"
_SUFFIX = " | req=%(request_id)s cor=%(correlation_id)s usr=%(user_id)s scr=%(screen_id)s"


class ContextFormatter(logging.Formatter):
    def __init__(self, fmt: str = _DEFAULT_FORMAT + _SUFFIX, datefmt: str | None = None) -> None:
        super().__init__(fmt=fmt, datefmt=datefmt)
