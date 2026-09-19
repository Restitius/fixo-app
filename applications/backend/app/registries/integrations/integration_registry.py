"""Integration Registry — catalogue of external provider bindings (pure)."""
from __future__ import annotations

from app.registries.integrations.integration_definition import IntegrationDefinition
from app.shared.exceptions.hierarchy import ConfigurationError


class IntegrationRegistry:
    """Registers and resolves IntegrationDefinition objects by ID."""

    def __init__(self) -> None:
        self._integrations: dict[str, IntegrationDefinition] = {}

    def register(self, definition: IntegrationDefinition, *, override: bool = False) -> None:
        if definition.integration_id in self._integrations and not override:
            raise ConfigurationError(
                f"Integration already registered: {definition.integration_id}",
                code="REGISTRY.DUPLICATE_INTEGRATION",
            )
        self._integrations[definition.integration_id] = definition

    def get(self, integration_id: str) -> IntegrationDefinition:
        try:
            return self._integrations[integration_id]
        except KeyError:
            raise ConfigurationError(
                f"Integration not registered: {integration_id}",
                code="REGISTRY.UNKNOWN_INTEGRATION",
            ) from None

    def exists(self, integration_id: str) -> bool:
        return integration_id in self._integrations

    def enabled_only(self) -> list[IntegrationDefinition]:
        return [d for d in self._integrations.values() if d.enabled]

    def find_by_category(self, category: str) -> list[IntegrationDefinition]:
        return [d for d in self._integrations.values() if d.category == category]

    def all_ids(self) -> list[str]:
        return sorted(self._integrations)

    def count(self) -> int:
        return len(self._integrations)
