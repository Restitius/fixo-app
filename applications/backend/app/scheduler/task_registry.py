"""ScheduledTask + TaskRegistry (pure mechanics)."""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

TaskHandler = Callable[..., Any]


@dataclass(frozen=True)
class ScheduledTask:
    task_id: str
    handler: TaskHandler
    schedule: Any  # app.scheduler.schedules.Schedule


class TaskRegistry:
    def __init__(self) -> None:
        self._tasks: dict[str, ScheduledTask] = {}

    def register(self, task: ScheduledTask, *, override: bool = False) -> None:
        if task.task_id in self._tasks and not override:
            raise ValueError(f"Task already registered: {task.task_id}")
        self._tasks[task.task_id] = task

    def get(self, task_id: str) -> ScheduledTask:
        try:
            return self._tasks[task_id]
        except KeyError:
            raise KeyError(f"Unknown scheduled task: {task_id}") from None

    def all(self) -> list[ScheduledTask]:
        return sorted(self._tasks.values(), key=lambda t: t.task_id)
