"""Job Registry — job IDs (JOB-*) to handler callables/classes."""
from __future__ import annotations

from typing import Any, Callable

from app.shared.exceptions.hierarchy import ConfigurationError

JobHandler = Callable[..., Any]


class JobRegistry:
    """Registers background job handlers under stable job IDs."""

    def __init__(self) -> None:
        self._jobs: dict[str, JobHandler] = {}

    def register(self, job_id: str, handler: JobHandler, *, override: bool = False) -> None:
        if job_id in self._jobs and not override:
            raise ConfigurationError(
                f"Job already registered: {job_id}",
                code="REGISTRY.DUPLICATE_JOB",
            )
        self._jobs[job_id] = handler

    def get(self, job_id: str) -> JobHandler:
        try:
            return self._jobs[job_id]
        except KeyError:
            raise ConfigurationError(
                f"Job not registered: {job_id}",
                code="REGISTRY.UNKNOWN_JOB",
            ) from None

    def exists(self, job_id: str) -> bool:
        return job_id in self._jobs

    def all_ids(self) -> list[str]:
        return sorted(self._jobs)

    def count(self) -> int:
        return len(self._jobs)
