"""Client Registry — catalogue of frontend application shells (CLT-*).

Registered from declarative definitions (app/clients/definitions.py) at
startup, mirroring ScreenRegistry exactly so consumers can resolve a client
by stable id or family without hard-coding implementations.
"""
from __future__ import annotations

from app.registries.clients.client_definition import ClientDefinition
from app.shared.exceptions.hierarchy import ConfigurationError


class ClientRegistry:
    """Registers and resolves ClientDefinition objects."""

    def __init__(self) -> None:
        self._clients: dict[str, ClientDefinition] = {}

    def register(self, definition: ClientDefinition, *, override: bool = False) -> None:
        if definition.id in self._clients and not override:
            raise ConfigurationError(
                f"Client already registered: {definition.id}",
                code="REGISTRY.DUPLICATE_CLIENT",
            )
        self._clients[definition.id] = definition

    def get(self, client_id: str) -> ClientDefinition:
        try:
            return self._clients[client_id]
        except KeyError:
            raise ConfigurationError(
                f"Client not registered: {client_id}",
                code="REGISTRY.UNKNOWN_CLIENT",
            ) from None

    def exists(self, client_id: str) -> bool:
        return client_id in self._clients

    def find_by_family(self, family: str) -> list[ClientDefinition]:
        return sorted(
            (c for c in self._clients.values() if c.family == family),
            key=lambda c: c.id,
        )

    def all(self) -> list[ClientDefinition]:
        return sorted(self._clients.values(), key=lambda c: c.id)

    def count(self) -> int:
        return len(self._clients)