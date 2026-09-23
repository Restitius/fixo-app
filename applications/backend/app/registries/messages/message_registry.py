"""Registry for stable, client-facing system message keys."""

from __future__ import annotations

from typing import Any

from app.registries.messages.message_definition import MessageDefinition
from app.shared.exceptions.hierarchy import ConfigurationError


class MessageRegistry:
    def __init__(self) -> None:
        self._messages: dict[str, MessageDefinition] = {}

    def register(self, key: str, message: dict[str, str] | MessageDefinition) -> None:
        if key in self._messages:
            raise ConfigurationError(
                f"System message already registered: {key}",
                code="REGISTRY.DUPLICATE_MESSAGE",
            )
        if isinstance(message, MessageDefinition):
            if key != message.message_id:
                raise ConfigurationError(
                    f"Message key does not match definition: {key}",
                    code="REGISTRY.INVALID_MESSAGE_ID",
                )
            definition = message
        else:
            definition = MessageDefinition(
                message_id=key,
                severity="success",
                presentation="toast",
                title=message["title"],
                body=message.get("body", ""),
            )
        self._messages[key] = definition

    def get(self, key: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        try:
            return self._messages[key].render(params)
        except KeyError:
            raise ConfigurationError(
                f"System message not registered: {key}",
                code="REGISTRY.UNKNOWN_MESSAGE",
            ) from None

    def all(self) -> dict[str, dict[str, Any]]:
        return {
            key: value.catalogue_entry()
            for key, value in sorted(self._messages.items())
        }

    def resolve_many(self, keys: list[str]) -> list[dict[str, Any]]:
        return [self._definition(key).catalogue_entry() for key in keys]

    def _definition(self, key: str) -> MessageDefinition:
        try:
            return self._messages[key]
        except KeyError:
            raise ConfigurationError(
                f"System message not registered: {key}",
                code="REGISTRY.UNKNOWN_MESSAGE",
            ) from None

    def count(self) -> int:
        return len(self._messages)


_registry: MessageRegistry | None = None


def set_message_registry(registry: MessageRegistry) -> None:
    global _registry
    _registry = registry


def get_message_registry() -> MessageRegistry:
    if _registry is None:
        raise RuntimeError("System message registry is not initialized")
    return _registry
