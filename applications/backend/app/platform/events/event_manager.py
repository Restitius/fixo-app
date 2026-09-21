"""EventManager — platform facade over event publish/dispatch (registered ids)."""
from __future__ import annotations

from typing import Any

from app.events.event_bus import EventBus


class EventManager(EventBus):
    """Registered event publisher used by the event adapter."""

    async def publish(self, event: Any) -> dict[str, str]:  # type: ignore[override]
        return await super().publish(event)