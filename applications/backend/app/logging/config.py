"""Logging configuration — console now, daily folder files designed.

Target layout (section 21)::

    storage/logs/YYYY/MONTH/DD/application.log | api.log | database.log |
    query.log | integration.log | security.log | events.log | jobs.log |
    notifications.log | errors.log
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

from app.logging.filters import ContextFilter
from app.logging.formatter import ContextFormatter


def configure_logging(
    *,
    level: str = "INFO",
    log_dir: str | Path | None = None,
    console: bool = True,
) -> None:
    """Configure the root logger.

    Console handler is active immediately; per-category daily file handlers
    activate when the handlers subsystem is implemented (handlers.py).
    """
    root = logging.getLogger()
    root.setLevel(level.upper())
    root.handlers.clear()

    if console:
        stream = logging.StreamHandler(sys.stdout)
        stream.setFormatter(ContextFormatter())
        stream.addFilter(ContextFilter())
        root.addHandler(stream)

    if log_dir is not None:
        # TODO(logging): attach DailyFolderFileHandler per Category.
        Path(log_dir).mkdir(parents=True, exist_ok=True)
