"""IntegrationManager - the ONLY doorway from domains to external systems."""
from __future__ import annotations

import logging
from typing import Any

from app.registries.integrations.integration_definition import IntegrationDefinition
from app.registries.integrations.integration_registry import IntegrationRegistry
from app.shared.exceptions.hierarchy import IntegrationError

logger = logging.getLogger(__name__)


def _build_provider(definition: IntegrationDefinition, client: Any = None) -> Any:
    """Build a provider adapter for an integration definition.

    This is the wiring seam: new providers are added here by category/provider
    key rather than scattered across domain code.
    """
    category = getattr(definition, "category", "")
    provider = getattr(definition, "provider", "")

    if category == "sms" and provider == "swala":
        from app.integrations.external.providers.sms.swala import SwalaSmsProvider

        return SwalaSmsProvider(definition, client=client)

    raise IntegrationError(
        f"No provider adapter for {category}/{provider} ({definition.integration_id})",
        code="INTEGRATION.NO_PROVIDER_ADAPTER",
    )


class IntegrationManager:
    """The only doorway from domains to external systems."""

    def __init__(self, registry: IntegrationRegistry, client_factory=_build_provider) -> None:
        self._registry = registry
        self._client_factory = client_factory

    @property
    def registry(self) -> IntegrationRegistry:
        return self._registry

    async def execute(self, integration_id: str, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Resolve the definition, pick the adapter, execute the operation."""
        definition = self._registry.get(integration_id)
        if not definition.enabled:
            raise IntegrationError(
                f"Integration disabled: {integration_id}",
                code="INTEGRATION.DISABLED",
            )
        provider = self._client_factory(definition)
        try:
            return await provider.execute(operation, payload)
        except IntegrationError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise IntegrationError(f"Integration call failed: {exc}") from exc

    async def health(self, integration_id: str) -> bool:
        """Cheap external-system probe for observability."""
        definition = self._registry.get(integration_id)
        provider = self._client_factory(definition)
        try:
            return await provider.health()
        except Exception as exc:  # noqa: BLE001
            logger.warning("integration health check failed: %s (%s)", integration_id, exc)
            return False
