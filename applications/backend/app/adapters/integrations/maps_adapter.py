"""MapsIntegrationAdapter — implements the MapsGateway port."""
from __future__ import annotations

from typing import Any

from app.integrations.external.manager import IntegrationManager


class MapsGatewayIntegrationIds:
    """Stable INT-* IDs for maps operations (adapter-private)."""

    GEOCODE = "INT.MAPS.GEOCODE.V1"
    ROUTING = "INT.MAPS.ROUTING.V1"


class MapsIntegrationAdapter:
    """Provider-agnostic maps surface backed by the integration manager."""

    def __init__(self, integration_manager: IntegrationManager) -> None:
        self._integrations = integration_manager

    async def geocode(self, address: str) -> dict[str, Any]:
        return await self._integrations.execute(MapsGatewayIntegrationIds.GEOCODE, "geocode", {"address": address})

    async def route(self, origin: dict[str, Any], destination: dict[str, Any]) -> dict[str, Any]:
        return await self._integrations.execute(
            MapsGatewayIntegrationIds.ROUTING,
            "route",
            {"origin": origin, "destination": destination},
        )