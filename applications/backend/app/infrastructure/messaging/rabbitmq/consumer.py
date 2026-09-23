"""RabbitMQ consumer adapter (aio-pika) with ack/nack semantics."""
from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from typing import Any


class RabbitConsumer:
    def __init__(
        self,
        url: str,
        queue: str,
        *,
        exchange: str = "fixo.events",
        routing_key: str = "#",
        prefetch: int = 10,
    ) -> None:
        self.url = url
        self.queue = queue
        self.prefetch = prefetch
        self.exchange = exchange
        self.routing_key = routing_key
        self._connection: Any = None

    async def run(self, handler: Callable[[Any], Awaitable[None]]) -> None:
        import aio_pika

        self._connection = await aio_pika.connect_robust(self.url)
        channel = await self._connection.channel()
        await channel.set_qos(prefetch_count=self.prefetch)
        exchange = await channel.declare_exchange(
            self.exchange, aio_pika.ExchangeType.TOPIC, durable=True
        )
        dead_exchange = await channel.declare_exchange(
            f"{self.exchange}.dead", aio_pika.ExchangeType.TOPIC, durable=True
        )
        queue = await channel.declare_queue(
            self.queue,
            durable=True,
            arguments={"x-dead-letter-exchange": dead_exchange.name},
        )
        await queue.bind(exchange, routing_key=self.routing_key)
        async with queue.iterator() as messages:
            async for message in messages:
                async with message.process(requeue=False):
                    await handler(json.loads(message.body.decode()))

    async def stop(self) -> None:
        if self._connection is not None:
            await self._connection.close()
            self._connection = None
