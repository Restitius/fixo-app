"""Event registration — catalogue EVT-* event classes."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def register_events(event_registry: Any) -> None:
    """Register domain event classes (populated as domains emit events)."""
    # TODO(domains): import each domain's events package and register classes.
    logger.info("event registry ready (domain events register as they land)")
