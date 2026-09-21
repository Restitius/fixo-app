"""Client registry + tracker tests — CLT-* definitions, resolution, fallbacks."""
from __future__ import annotations

import pytest

from app.clients.context import ClientContext
from app.clients.definitions import ALL as CLIENT_DEFINITIONS
from app.clients.tracker import ClientTracker
from app.registries.clients.client_definition import ClientDefinition
from app.registries.clients.client_registry import ClientRegistry
from app.shared.exceptions.hierarchy import ConfigurationError


def _registry() -> ClientRegistry:
    registry = ClientRegistry()
    for definition in CLIENT_DEFINITIONS:
        registry.register(definition)
    return registry


def test_seed_definitions_are_registered():
    registry = _registry()
    assert registry.count() == len(CLIENT_DEFINITIONS)
    assert registry.exists("CLT-WEB-USER")
    assert registry.exists("CLT-WEB-PROVIDER")
    assert registry.exists("CLT-WEB-ADMIN")
    assert registry.exists("CLT-MOBILE-ANDROID")
    assert registry.exists("CLT-MOBILE-IOS")
    assert registry.exists("CLT-API")
    assert registry.exists("CLT-INTERNAL")
    assert registry.exists("CLT-UNKNOWN")


def test_duplicate_registration_rejected():
    registry = _registry()
    with pytest.raises(ConfigurationError):
        registry.register(
            ClientDefinition(id="CLT-WEB-USER", name="dup", kind="web", family="customer")
        )
    exchange = ClientDefinition(id="CLT-X", name="x", kind="web", family="customer")
    registry.register(exchange)
    assert registry.exists("CLT-X")


def test_get_unknown_raises():
    registry = _registry()
    with pytest.raises(ConfigurationError):
        registry.get("CLT-DOES-NOT-EXIST")


def test_find_by_family():
    registry = _registry()
    customers = registry.find_by_family("customer")
    ids = {c.id for c in customers}
    assert "CLT-WEB-USER" in ids
    assert "CLT-MOBILE-IOS" in ids
    assert all(c.family == "customer" for c in customers)


def test_tracker_resolves_known_client():
    tracker = ClientTracker(_registry())
    ctx = tracker.resolve("CLT-WEB-PROVIDER", "1.2.0")
    assert isinstance(ctx, ClientContext)
    assert ctx.client_id == "CLT-WEB-PROVIDER"
    assert ctx.kind == "web"
    assert ctx.family == "provider"
    assert ctx.version == "1.2.0"


def test_tracker_falls_back_for_unknown_and_missing():
    tracker = ClientTracker(_registry())
    assert tracker.resolve("CLT-NOPE").client_id == "CLT-UNKNOWN"
    assert tracker.resolve(None).client_id == "CLT-UNKNOWN"
    assert tracker.resolve().kind == "unknown"


def test_internal_family_available():
    tracker = ClientTracker(_registry())
    ctx = tracker.resolve("CLT-INTERNAL")
    assert ctx.family == "internal"
    assert ctx.kind == "internal"