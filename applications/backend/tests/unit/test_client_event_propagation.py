"""Event/job/screen propagation tests — shell attribution flows downstream."""
from __future__ import annotations

from app.events.event import DomainEvent, EventContext
from app.events.event_bus import EventBus
from app.logging.context import bind, clear
from app.platform.origin import capture_origin
from app.registries.screens.screen_definition import ScreenDefinition
from app.registries.screens.screen_permissions import ScreenPermissions
from app.registries.screens.screen_registry import ScreenRegistry


async def test_event_bus_backfills_client_attribution_from_log_context():
    clear()
    bind(
        client_id="CLT-MOBILE-IOS",
        client_version="3.1.0",
        screen_id="SCR-BOOK-001",
        correlation_id="COR-ABC",
        user_id="USR-1",
    )
    bus = EventBus()
    event = DomainEvent(name="EVT-TEST-CLIENT", payload={"booking_id": "BKG-1"}, context=EventContext())
    await bus.publish(event)
    assert event.context.client_id == "CLT-MOBILE-IOS"
    assert event.context.client_version == "3.1.0"
    assert event.context.screen_id == "SCR-BOOK-001"
    assert event.context.correlation_id == "COR-ABC"
    assert event.context.user_id == "USR-1"
    clear()


async def test_event_bus_preserves_explicit_context():
    clear()
    bind(client_id="CLT-WEB-USER", client_version="1.0.0")
    bus = EventBus()
    event = DomainEvent(
        name="EVT-TEST-EXPLICIT",
        payload={},
        context=EventContext(client_id="CLT-WEB-ADMIN", client_version="9.9.9"),
    )
    await bus.publish(event)
    assert event.context.client_id == "CLT-WEB-ADMIN"
    assert event.context.client_version == "9.9.9"
    clear()


def test_capture_origin_snapshots_shell_attribution():
    clear()
    bind(client_id="CLT-WEB-PROVIDER", client_version="1.2.3", user_id="PRV-9", session_id="ses-1")
    origin = capture_origin()
    assert origin["client_id"] == "CLT-WEB-PROVIDER"
    assert origin["client_version"] == "1.2.3"
    assert origin["user_id"] == "PRV-9"
    clear()


def test_screen_registry_client_axis():
    registry = ScreenRegistry()
    shared = ScreenDefinition(id="SCR-SHARED-001", name="Shared", module="m", route="/bookings", permission="booking.view")
    provider = ScreenDefinition(
        id="SCR-PRV-BOOK-001",
        name="Provider Bookings",
        module="bookings",
        route="/providers/bookings",
        permission="booking.view",
        clients=("CLT-WEB-PROVIDER",),
    )
    registry.register(shared)
    registry.register(provider)

    assert registry.find_by_client("CLT-WEB-PROVIDER") == [provider]
    assert registry.find_by_client("CLT-WEB-USER") == []
    assert registry.find_by_client_and_route("CLT-WEB-USER", "/bookings") is shared
    assert registry.find_by_client_and_route("CLT-WEB-PROVIDER", "/providers/bookings") is provider
    assert registry.find_by_client_and_route("CLT-WEB-USER", "/providers/bookings") is None


def test_screen_permissions_client_visibility():
    granted = frozenset({"booking.view"})
    shared = ScreenDefinition(id="SCR-1", name="s", module="m", route="/b", permission="booking.view")
    provider = ScreenDefinition(
        id="SCR-2", name="p", module="m", route="/pb", permission="booking.view",
        clients=("CLT-WEB-PROVIDER",),
    )
    assert ScreenPermissions.visible_for_client(granted, shared, "CLT-WEB-USER")
    assert ScreenPermissions.visible_for_client(granted, provider, "CLT-WEB-PROVIDER")
    assert not ScreenPermissions.visible_for_client(granted, provider, "CLT-WEB-USER")
    assert not ScreenPermissions.visible_for_client(frozenset({"other"}), provider, "CLT-WEB-PROVIDER")