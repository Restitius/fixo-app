"""Listener registration — bind listeners to events they react to."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def register_listeners(listener_registry: Any) -> None:
    """Bind domain listeners (side-effect handlers) to event names."""
    # TODO(domains): bind write_activity / notify / publish listeners here.
    logger.info("listener registry ready (bindings arrive with domain listeners)")
