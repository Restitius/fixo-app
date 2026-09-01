"""NotificationManager — single entry point for sending notifications.

Domains NEVER talk to channels directly; they call the manager with a
registered notification key (NTF-*). Lifecycle policies (dedupe/ack/expiry/
escalation) apply here, centrally.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class NotificationResult:
    notification_id: str
    key: str
    delivered_channels: list[str] = field(default_factory=list)
    deduplicated: bool = False
    persisted: bool = False


class NotificationManager:
    """Send persistent notifications through configured channels."""

    def __init__(self, dispatcher: Any, registry: Any) -> None:
        self._dispatcher = dispatcher
        self._registry = registry

    async def send(
        self,
        key: str,
        recipient_id: str,
        payload: dict,
        *,
        channels: list[str] | None = None,
        dedupe_window_seconds: int = 0,
    ) -> NotificationResult:
        """Validate key against registry, apply lifecycle, deliver, persist."""
        self._registry.get(key)  # fails fast on unregistered keys
        raise NotImplementedError("NotificationManager.send")
