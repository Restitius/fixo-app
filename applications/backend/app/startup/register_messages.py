"""Load every domain message catalogue under a stable domain.action key."""

from __future__ import annotations

import importlib
import logging
import pkgutil
from pathlib import Path
from typing import Any

from app.registries.messages.message_registry import set_message_registry

logger = logging.getLogger(__name__)


def register_messages(message_registry: Any) -> None:
    domains_root = Path(__file__).resolve().parent.parent / "domains"
    for messages_dir in sorted(domains_root.glob("*/messages")):
        domain = messages_dir.parent.name
        package = f"app.domains.{domain}.messages"
        for module_info in pkgutil.iter_modules([str(messages_dir)]):
            if module_info.name.startswith("_"):
                continue
            module = importlib.import_module(f"{package}.{module_info.name}")
            for definition in getattr(module, "MESSAGE_DEFINITIONS", ()):
                message_registry.register(definition.message_id, definition)
            for action, message in getattr(module, "MESSAGES", {}).items():
                message_registry.register(f"{domain}.{action}", message)
    set_message_registry(message_registry)
    logger.info("system message registry loaded: %s definitions", message_registry.count())
