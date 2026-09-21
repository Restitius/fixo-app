"""IntegrationHealthChecker — probes enabled integrations for readiness."""
from __future__ import annotations

from typing import Any

from app.integrations.external.manager import IntegrationManager


class IntegrationHealthChecker:
    def __init__(self, manager: IntegrationManager) -> None:
        self._manager = manager

    async def check_all(self) -> list[dict[str, Any]]:
        """One health entry per enabled integration definition."""
        raise NotImplementedError("IntegrationHealthChecker.check_all")
