"""Client registration — load CLT-* definitions into the ClientRegistry."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def register_clients(client_registry: Any) -> None:
    """Register every client defined under app/clients/definitions."""
    from app.clients.definitions import ALL

    for definition in ALL:
        client_registry.register(definition)
    logger.info("client registry loaded: %s clients", client_registry.count())