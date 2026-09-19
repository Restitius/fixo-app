"""Listener: Queues the NTF-AUTH-* notification for the owner."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class NotifySessionEventListener:
    """Reacts to Authentication domain events (side effects live ONLY here)."""

    async def handle(self, event: Any) -> None:
        """Process the event; failures are isolated by the dispatcher/bus."""
        raise NotImplementedError("NotifySessionEventListener.handle")
