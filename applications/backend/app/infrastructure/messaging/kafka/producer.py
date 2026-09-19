"""Kafka producer adapter (aiokafka)."""
from __future__ import annotations

from typing import Any


class KafkaProducerAdapter:
    def __init__(self, brokers: list[str], *, client_id: str = "fixo-app") -> None:
        self.brokers = brokers
        self.client_id = client_id

    async def start(self) -> None:
        raise NotImplementedError("KafkaProducerAdapter.start")

    async def send(self, topic: str, key: str | None, payload: dict[str, Any]) -> None:
        raise NotImplementedError("KafkaProducerAdapter.send")

    async def stop(self) -> None:
        raise NotImplementedError("KafkaProducerAdapter.stop")
