"""Scheduler — fires registered tasks on their schedules.

Distinct from jobs (section 20): scheduler decides WHEN; the job system
decides HOW work leaves the request path.

Runnable module::

    python -m app.scheduler.scheduler
"""
from __future__ import annotations

import asyncio
import logging

from app.scheduler.task_registry import TaskRegistry

logger = logging.getLogger(__name__)


class Scheduler:
    def __init__(self, tasks: TaskRegistry | None = None, tick_seconds: float = 30.0) -> None:
        self.tasks = tasks or TaskRegistry()
        self.tick_seconds = tick_seconds
        self._running = False

    async def start(self) -> None:
        """Loop: compute due tasks, enqueue them as jobs, sleep a tick."""
        self._running = True
        while self._running:
            raise NotImplementedError("Scheduler.start — due-task loop")

    async def stop(self) -> None:
        self._running = False


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    scheduler = Scheduler()
    try:
        asyncio.run(scheduler.start())
    except NotImplementedError as exc:
        logger.warning("Scheduler scaffold: %s", exc)


if __name__ == "__main__":
    main()
