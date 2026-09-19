"""Worker — consumes queued jobs and executes registered handlers.

Runnable module::

    python -m app.jobs.worker

Queue backends (Redis/Celery, RabbitMQ, Kafka) plug in behind JobDispatcher;
the worker only knows the JobRegistry + handler contract.
"""
from __future__ import annotations

import asyncio
import logging

from app.registries.jobs.job_registry import JobRegistry

logger = logging.getLogger(__name__)


class Worker:
    def __init__(self, jobs: JobRegistry, poll_interval_seconds: float = 1.0) -> None:
        self._jobs = jobs
        self._poll_interval_seconds = poll_interval_seconds
        self._running = False

    async def run_forever(self) -> None:
        """Poll the queue, execute handlers, honor retry/dead-letter policy."""
        self._running = True
        while self._running:
            raise NotImplementedError("Worker.run_forever — connect queue backend")


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    worker = Worker(JobRegistry())
    try:
        asyncio.run(worker.run_forever())
    except NotImplementedError as exc:
        logger.warning("Worker scaffold: %s", exc)


if __name__ == "__main__":
    main()
