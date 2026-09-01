"""IntegrationManager — the ONLY doorway from domains to external systems.

Wrong (forbidden)::

    stripe = StripeClient(...); stripe.charge(...)

Right (architecture section 7)::

    await integration_manager.execute("PAYMENT.PRIMARY", "charge", data)

Flow (section 8):

    Service --> IntegrationManager --(integration_id)--> IntegrationRegistry
            --> IntegrationDefinition --> Provider Adapter --> HTTP Client
"""
from __future__ import annotations

from typing import Any

from app.registries.integrations.integration_registry import IntegrationRegistry
from app.shared.exceptions.hierarchy import IntegrationError


class IntegrationManager:
    def __init__(self, registry: IntegrationRegistry) -> None:
        self._registry = registry

    @property
    def registry(self) -> IntegrationRegistry:
        return self._registry

    async def execute(self, integration_id: str, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Resolve the definition, pick the adapter, apply retries/breaker."""
        definition = self._registry.get(integration_id)
        if not definition.enabled:
            raise IntegrationError(
                f"Integration disabled: {integration_id}",
                code="INTEGRATION.DISABLED",
            )
        raise NotImplementedError(
            f"IntegrationManager.execute({integration_id}.{operation}) "
            "- adapter resolution + circuit breaker + retries"
        )

    async def health(self, integration_id: str) -> bool:
        """Cheap external-system probe for observability."""
        self._registry.get(integration_id)
        raise NotImplementedError("IntegrationManager.health")
