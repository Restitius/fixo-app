"""NotificationDispatcher — routes a rendered message to one channel."""
from __future__ import annotations

from typing import Any, Protocol


class Channel(Protocol):
    """Every delivery channel implements deliver()."""

    name: str

    async def deliver(self, recipient_id: str, subject: str, body: str, meta: dict) -> bool:
        ...


class NotificationDispatcher:
    """Holds channel implementations by name."""

    def __init__(self) -> None:
        self._channels: dict[str, Channel] = {}

    def register_channel(self, channel: Channel) -> None:
        self._channels[channel.name] = channel

    def channel_names(self) -> list[str]:
        return sorted(self._channels)

    async def dispatch(self, channel_name: str, recipient_id: str, subject: str, body: str, meta: dict | None = None) -> bool:
        try:
            channel = self._channels[channel_name]
        except KeyError:
            raise LookupError(f"Channel not registered: {channel_name}") from None
        return await channel.deliver(recipient_id, subject, body, meta or {})
