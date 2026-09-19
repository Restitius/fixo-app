"""SchedulerManager - periodic background jobs with a manual tick hook.

Each job is a named coroutine plus an interval. The loop sleeps in short
ticks so `tick()` (used by the internal endpoint and tests) can force a
full pass deterministically without waiting for the wall clock.
"""
from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from typing import Any

logger = logging.getLogger(__name__)

JobHandler = Callable[[], Awaitable[dict[str, Any]]]


class SchedulerManager:
    TICK_SECONDS = 5

    def __init__(self) -> None:
        self._jobs: dict[str, dict[str, Any]] = {}
        self._last_run: dict[str, float] = {}
        self._task: asyncio.Task | None = None
        self._running = False

    def register(self, job_id: str, handler: JobHandler, interval_seconds: int) -> None:
        if interval_seconds < self.TICK_SECONDS:
            raise ValueError(f"{job_id}: interval below tick granularity")
        self._jobs[job_id] = {"handler": handler, "interval": interval_seconds}
        self._last_run.setdefault(job_id, 0.0)
        logger.info("job registered %s every %ss", job_id, interval_seconds)

    async def start(self) -> None:
        if self._running or not self._jobs:
            return
        self._running = True
        self._task = asyncio.get_running_loop().create_task(self._loop())
        logger.info("scheduler started with %d jobs", len(self._jobs))

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self) -> None:
        while self._running:
            try:
                await self.run_due()
            except Exception:  # the loop must survive any job failure
                logger.exception("scheduler pass failed")
            await asyncio.sleep(self.TICK_SECONDS)

    async def run_due(self) -> dict[str, Any]:
        """Run every job whose interval has elapsed; returns per-job results."""
        now = time.monotonic()
        results: dict[str, Any] = {}
        for job_id, spec in self._jobs.items():
            if now - self._last_run[job_id] >= spec["interval"]:
                self._last_run[job_id] = now
                try:
                    results[job_id] = await spec["handler"]()
                except Exception as exc:
                    logger.exception("job %s failed", job_id)
                    results[job_id] = {"error": str(exc)}
        return results
