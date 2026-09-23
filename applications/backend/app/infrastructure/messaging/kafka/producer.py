"""Kafka producer adapter (aiokafka)."""
from __future__ import annotations

import json
from typing import Any


class KafkaProducerAdapter:
    def __init__(self, brokers: list[str], *, client_id: str = "fixo-app") -> None:
        self.brokers = brokers
        self.client_id = client_id
        self._producer: Any = None

    async def start(self) -> None:
        if self._producer is not None:
            return
        from aiokafka import AIOKafkaProducer

        self._producer = AIOKafkaProducer(
            bootstrap_servers=self.brokers,
            client_id=self.client_id,
            acks="all",
            enable_idempotence=True,
            value_serializer=lambda value: json.dumps(value, separators=(",", ":")).encode(),
        )
        await self._producer.start()

    async def send(self, topic: str, key: str | None, payload: dict[str, Any]) -> None:
        if self._producer is None:
            raise RuntimeError("Kafka producer is not started")
        await self._producer.send_and_wait(topic, payload, key=key.encode() if key else None)

    async def stop(self) -> None:
        if self._producer is not None:
            await self._producer.stop()
            self._producer = None
