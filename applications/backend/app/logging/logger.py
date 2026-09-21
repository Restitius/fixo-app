"""Logger factory — category-aware named loggers."""
from __future__ import annotations

import logging


def get_logger(name: str, category: str | None = None) -> logging.Logger:
    """Return a logger namespaced by category, e.g. 'db.query_executor'."""
    if category:
        return logging.getLogger(f"{category}.{name}")
    return logging.getLogger(name)
