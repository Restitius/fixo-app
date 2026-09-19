"""JobDispatcher — services enqueue work; workers execute it later."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.registries.jobs.job_registry import JobRegistry
from app.shared.helpers.identifiers import new_job_run_id


@dataclass
class JobHandle:
    job_run_id: str = field(default_factory=new_job_run_id)
    job_id: str = ""
    status: str = "queued"


class JobDispatcher:
    """Enqueue by JOB-* id; the queue backend is injected/swappable."""

    def __init__(self, jobs: JobRegistry, queue: Any | None = None) -> None:
        self._jobs = jobs
        self._queue = queue

    async def enqueue(self, job_id: str, payload: dict, *, delay_seconds: int = 0) -> JobHandle:
        """Validate job exists, push to queue with delay, return handle."""
        self._jobs.get(job_id)  # fail fast on unknown jobs
        handle = JobHandle(job_id=job_id)
        raise NotImplementedError("JobDispatcher.enqueue — wire queue backend")
