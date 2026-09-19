"""Listener: Queues the NTF-AST-* notification for the owner."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class CreateAssetNotificationListener:
    """Reacts to Asset domain events (side effects live ONLY here)."""

    async def handle(self, event: Any) -> None:
        """Process the event; failures are isolated by the dispatcher/bus."""
        raise NotImplementedError("CreateAssetNotificationListener.handle")
