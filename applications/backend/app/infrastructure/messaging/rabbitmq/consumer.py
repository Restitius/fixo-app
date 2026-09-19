"""RabbitMQ consumer adapter (aio-pika) with ack/nack semantics."""
from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any


class RabbitConsumer:
    def __init__(self, url: str, queue: str, *, prefetch: int = 10) -> None:
        self.url = url
        self.queue = queue
        self.prefetch = prefetch

    async def run(self, handler: Callable[[Any], Awaitable[None]]) -> None:
        raise NotImplementedError("RabbitConsumer.run")

    async def stop(self) -> None:
        raise NotImplementedError("RabbitConsumer.stop")
