"""Registry Manager — the single access point for every application registry.

Architecture (§12):

    RegistryManager
    |-- QueryRegistry          (SQL governance)
    |-- IntegrationRegistry    (external systems)
    |-- ScreenRegistry         (UI traceability)
    |-- EventRegistry          + ListenerRegistry
    |-- JobRegistry
    |-- NotificationRegistry
    '-- CommandRegistry

Startup populates these via app/startup/register_*.py; layers then resolve
components by stable IDs instead of hard-coding implementations.
"""
from __future__ import annotations

from app.registries.commands.command_registry import CommandRegistry
from app.registries.events.event_registry import EventRegistry
from app.registries.events.listener_registry import ListenerRegistry
from app.registries.integrations.integration_registry import IntegrationRegistry
from app.registries.jobs.job_registry import JobRegistry
from app.registries.notifications.notification_registry import NotificationRegistry
from app.registries.queries.query_registry import QueryRegistry
from app.registries.screens.screen_registry import ScreenRegistry


class RegistryManager:
    """Owns one instance of each registry for the running application."""

    def __init__(self) -> None:
        self.queries: QueryRegistry = QueryRegistry()
        self.integrations: IntegrationRegistry = IntegrationRegistry()
        self.screens: ScreenRegistry = ScreenRegistry()
        self.events: EventRegistry = EventRegistry()
        self.listeners: ListenerRegistry = ListenerRegistry()
        self.jobs: JobRegistry = JobRegistry()
        self.notifications: NotificationRegistry = NotificationRegistry()
        self.commands: CommandRegistry = CommandRegistry()

    def summary(self) -> dict[str, int]:
        """Registered-item counts per registry (used by /system/info and logs)."""
        return {
            "queries": self.queries.count(),
            "integrations": self.integrations.count(),
            "screens": self.screens.count(),
            "events": self.events.count(),
            "listeners": self.listeners.count(),
            "jobs": self.jobs.count(),
            "notifications": self.notifications.count(),
            "commands": self.commands.count(),
        }
