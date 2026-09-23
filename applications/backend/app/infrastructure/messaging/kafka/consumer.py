"""Kafka consumer adapter (aiokafka) feeding the job/event pipelines."""
from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from typing import Any


class KafkaConsumerAdapter:
    def __init__(self, brokers: list[str], group_id: str, topics: list[str]) -> None:
        self.brokers = brokers
        self.group_id = group_id
        self.topics = topics
        self._consumer: Any = None

    async def run(self, handler: Callable[[Any], Awaitable[None]]) -> None:
        from aiokafka import AIOKafkaConsumer

        self._consumer = AIOKafkaConsumer(
            *self.topics,
            bootstrap_servers=self.brokers,
            group_id=self.group_id,
            enable_auto_commit=False,
            auto_offset_reset="earliest",
        )
        await self._consumer.start()
        try:
            async for record in self._consumer:
                await handler(json.loads(record.value.decode()))
                await self._consumer.commit()
        finally:
            await self.stop()

    async def stop(self) -> None:
        if self._consumer is not None:
            await self._consumer.stop()
            self._consumer = None
