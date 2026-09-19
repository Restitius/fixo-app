"""RabbitMQ publisher adapter (aio-pika)."""
from __future__ import annotations

from typing import Any


class RabbitPublisher:
    def __init__(self, url: str, *, exchange: str = "fixo.events") -> None:
        self.url = url
        self.exchange = exchange

    async def connect(self) -> None:
        raise NotImplementedError("RabbitPublisher.connect")

    async def publish(self, routing_key: str, payload: dict[str, Any]) -> None:
        raise NotImplementedError("RabbitPublisher.publish")

    async def close(self) -> None:
        raise NotImplementedError("RabbitPublisher.close")
