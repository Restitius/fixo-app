"""BaseIntegration - ABC every provider adapter extends."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.integrations.external.clients.http_client import HttpClient
from app.registries.integrations.integration_definition import IntegrationDefinition
from app.security.secrets import SecretResolver


class BaseIntegration(ABC):
    """Common wiring: definition + shared HTTP client + timeout policy."""

    def __init__(self, definition: IntegrationDefinition, client: HttpClient | None = None) -> None:
        self.definition = definition
        self.client = client
        self._secrets = SecretResolver()

    @property
    def integration_id(self) -> str:
        return self.definition.integration_id

    def secret(self, key: str, *, required: bool = True, default: str = "") -> str:
        """Read a provider secret by env key."""
        return self._secrets.get(key, required=required, default=default)

    def optional_secret(self, key: str, default: str = "") -> str:
        return self._secrets.get(key, required=False, default=default)

    @abstractmethod
    async def execute(self, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Run one operation against the external system."""

    @abstractmethod
    async def health(self) -> bool:
        """Cheap liveness probe."""
