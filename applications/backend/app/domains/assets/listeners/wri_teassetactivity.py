"""Listener: Persists an asset activity/history row for every event."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class WriteAssetActivityListener:
    """Reacts to Asset domain events (side effects live ONLY here)."""

    async def handle(self, event: Any) -> None:
        """Process the event; failures are isolated by the dispatcher/bus."""
        raise NotImplementedError("WriteAssetActivityListener.handle")
