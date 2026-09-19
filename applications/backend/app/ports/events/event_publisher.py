"""Event-publishing port — domains raise events without knowing transports."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class EventPublisher(Protocol):
    """Publish a domain event; delivery responsibilities belong to adapters."""

    async def publish(self, event: Any) -> Any: ...