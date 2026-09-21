"""MapsGateway — geocoding/routing capability (provider-agnostic)."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class MapsGateway(Protocol):
    """Geocode an address and route between two points."""

    async def geocode(self, address: str) -> dict[str, Any]: ...
    async def route(self, origin: dict[str, Any], destination: dict[str, Any]) -> dict[str, Any]: ...