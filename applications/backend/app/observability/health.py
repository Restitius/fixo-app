"""Health checks — liveness (cheap) vs readiness (dependencies)."""
from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass

Checker = Callable[[], Awaitable["HealthCheck"]]


@dataclass(frozen=True)
class HealthCheck:
    component: str
    status: str            # 'up' | 'down' | 'degraded'
    detail: str = ""


class HealthReporter:
    """Aggregates registered component checkers into one report."""

    def __init__(self) -> None:
        self._checkers: dict[str, Checker] = {}

    def register(self, component: str, checker: Checker) -> None:
        self._checkers[component] = checker

    def components(self) -> list[str]:
        return sorted(self._checkers)

    async def readiness(self) -> list[HealthCheck]:
        """Run every checker; failures become status='down' entries."""
        raise NotImplementedError("HealthReporter.readiness")

    async def liveness(self) -> HealthCheck:
        """Process-alive probe; always up when reachable."""
        return HealthCheck(component="process", status="up", detail="reachable")
