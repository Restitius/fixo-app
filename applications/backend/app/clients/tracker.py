"""ClientTracker — resolves X-Client-ID into a ClientContext.

Flow (mirrors ScreenTracker):

    Request(X-Client-ID) --> ClientContextMiddleware --> ClientTracker
                         --> ClientRegistry lookup --> RequestContext/log binding

Always returns a ClientContext: unknown/missing ids fall back to CLT-UNKNOWN
so every request still carries an attribution value.
"""
from __future__ import annotations

import logging

from app.clients.context import ClientContext
from app.registries.clients.client_definition import ClientDefinition
from app.registries.clients.client_registry import ClientRegistry

logger = logging.getLogger(__name__)


class ClientTracker:
    def __init__(self, clients: ClientRegistry) -> None:
        self._clients = clients

    def resolve(
        self,
        client_id: str | None = None,
        client_version: str | None = None,
    ) -> ClientContext:
        """Resolve a client id; unknown/missing ids fall back to CLT-UNKNOWN."""
        if client_id and self._clients.exists(client_id):
            definition: ClientDefinition = self._clients.get(client_id)
            return ClientContext(
                client_id=definition.id,
                name=definition.name,
                kind=definition.kind,
                family=definition.family,
                version=client_version or "",
            )
        if client_id:
            logger.warning("Unknown client id presented: %s", client_id)
        fallback: ClientDefinition = self._clients.get("CLT-UNKNOWN")
        return ClientContext(
            client_id=fallback.id,
            name=fallback.name,
            kind=fallback.kind,
            family=fallback.family,
            version=client_version or "",
        )