"""BaseIntegration — ABC every provider adapter extends."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.integrations.clients.http_client import HttpClient
from app.registries.integrations.integration_definition import IntegrationDefinition


class BaseIntegration(ABC):
    """Common wiring: definition + shared HTTP client + timeout policy."""

    def __init__(self, definition: IntegrationDefinition, client: HttpClient | None = None) -> None:
        self.definition = definition
        self.client = client

    @property
    def integration_id(self) -> str:
        return self.definition.integration_id

    @abstractmethod
    async def execute(self, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Run one operation against the external system."""

    @abstractmethod
    async def health(self) -> bool:
        """Cheap liveness probe."""
