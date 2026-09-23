"""RabbitMQ publisher adapter (aio-pika)."""
from __future__ import annotations

import json
from typing import Any


class RabbitPublisher:
    def __init__(self, url: str, *, exchange: str = "fixo.events") -> None:
        self.url = url
        self.exchange = exchange
        self._connection: Any = None
        self._channel: Any = None
        self._exchange: Any = None

    async def connect(self) -> None:
        if self._connection is not None:
            return
        import aio_pika

        self._connection = await aio_pika.connect_robust(self.url)
        self._channel = await self._connection.channel(publisher_confirms=True)
        self._exchange = await self._channel.declare_exchange(
            self.exchange, aio_pika.ExchangeType.TOPIC, durable=True
        )

    async def publish(self, routing_key: str, payload: dict[str, Any]) -> None:
        if self._exchange is None:
            raise RuntimeError("RabbitMQ publisher is not connected")
        import aio_pika

        message_id = str(payload.get("message_id") or payload.get("event_id") or "") or None
        message = aio_pika.Message(
            body=json.dumps(payload, separators=(",", ":")).encode(),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            message_id=message_id,
            correlation_id=str(payload.get("correlation_id") or "") or None,
        )
        await self._exchange.publish(message, routing_key=routing_key, mandatory=True)

    async def close(self) -> None:
        if self._connection is not None:
            await self._connection.close()
            self._connection = self._channel = self._exchange = None
