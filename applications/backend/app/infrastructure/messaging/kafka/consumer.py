"""Kafka consumer adapter (aiokafka) feeding the job/event pipelines."""
from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any


class KafkaConsumerAdapter:
    def __init__(self, brokers: list[str], group_id: str, topics: list[str]) -> None:
        self.brokers = brokers
        self.group_id = group_id
        self.topics = topics

    async def run(self, handler: Callable[[Any], Awaitable[None]]) -> None:
        raise NotImplementedError("KafkaConsumerAdapter.run (consume loop)")

    async def stop(self) -> None:
        raise NotImplementedError("KafkaConsumerAdapter.stop")
