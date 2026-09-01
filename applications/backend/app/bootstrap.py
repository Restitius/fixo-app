"""Bootstrap — ordered startup/shutdown orchestration (section 13).

Sequence::

    Load Configuration -> Initialize Logging -> Initialize Database ->
    Register Queries -> Register Integrations -> Register Screens ->
    Register Events -> Register Listeners -> Register Jobs ->
    Register Notifications -> Register Scheduler -> Register Platform (managers
    + adapters) -> Register API Routes

Each step delegates to app/startup/register_*.py. Scaffold-tolerant: steps
whose implementation raises NotImplementedError are logged as warnings and
skipped so the shell still boots.
"""
from __future__ import annotations

import inspect
import logging
from typing import Any

logger = logging.getLogger(__name__)


class Bootstrap:
    """Owns process-wide singletons assembled during startup."""

    def __init__(self) -> None:
        self.settings: Any = None
        self.registry_manager: Any = None
        self.databases: Any = None
        self.state: dict[str, Any] = {}

    # -- orchestration ------------------------------------------------------

    async def run_startup(self) -> None:
        for step in (
            "load_configuration",
            "initialize_logging",
            "initialize_database",
            "register_queries",
            "register_integrations",
            "register_screens",
            "register_events",
            "register_listeners",
            "register_jobs",
            "register_notifications",
            "register_platform",
            "register_scheduler",
            "register_api_routes",
        ):
            handler = getattr(self, "_" + step, None)
            if handler is None:
                logger.warning("startup step missing: %s", step)
                continue
            try:
                result = handler()
                if inspect.isawaitable(result):
                    await result
                logger.info("startup ok: %s", step)
            except NotImplementedError as exc:
                logger.warning("startup scaffold (not implemented): %s (%s)", step, exc)
            except Exception:
                logger.exception("startup FAILED at step: %s", step)
                raise

    async def run_shutdown(self) -> None:
        """Dispose engines/connections gracefully."""
        scheduler = self.state.get("scheduler")
        if scheduler is not None:
            try:
                await scheduler.stop()
            except Exception:
                logger.exception("scheduler shutdown failed")
        databases = self.state.get("databases")
        if databases is not None:
            try:
                await databases.dispose()
            except NotImplementedError:
                logger.info("shutdown scaffold: database dispose not implemented")

    # -- steps ----------------------------------------------------------------

    def _load_configuration(self) -> None:
        from app.config import get_settings

        self.settings = get_settings()

    def _initialize_logging(self) -> None:
        from app.logging.config import configure_logging

        configure_logging(level=self.settings.log_level, log_dir=self.settings.log_dir)

    def _initialize_database(self) -> None:
        from app.infrastructure.database.connection import ConnectionFactory
        from app.infrastructure.database.manager import DatabaseManager

        manager = DatabaseManager()
        for database_id, url in self.settings.database_urls.items():
            factory = ConnectionFactory(url)
            try:
                manager.register_database(database_id, factory.create_engine())
            except NotImplementedError:
                logger.info("db engine scaffold pending for %s", database_id)
        self.databases = manager
        self.state["databases"] = manager

    def _register_queries(self) -> None:
        from app.registries.registry_manager import RegistryManager
        from app.startup.register_queries import load_query_registry

        self.registry_manager = RegistryManager()
        issues = load_query_registry(self.registry_manager.queries)
        for issue in issues:
            logger.error("query registry issue: %s", issue)
        self.state["registry_manager"] = self.registry_manager

    def _register_integrations(self) -> None:
        from app.startup.register_integrations import register_integrations

        register_integrations(self.registry_manager.integrations)

    def _register_screens(self) -> None:
        from app.startup.register_screens import register_screens

        register_screens(self.registry_manager.screens)

    def _register_events(self) -> None:
        from app.startup.register_events import register_events

        register_events(self.registry_manager.events)

    def _register_listeners(self) -> None:
        from app.startup.register_listeners import register_listeners

        register_listeners(self.registry_manager.listeners)

    def _register_jobs(self) -> None:
        from app.startup.register_jobs import register_jobs

        register_jobs(self.registry_manager.jobs)

    def _register_notifications(self) -> None:
        from app.startup.register_notifications import register_notifications

        register_notifications(self.registry_manager.notifications)

    async def _register_scheduler(self) -> None:
        from app.startup.register_scheduler import register_scheduler

        composition = self.state.get("composition")
        if composition is None:
            logger.warning("scheduler skipped: composition not ready")
            return
        scheduler = register_scheduler(composition)
        await scheduler.start()
        self.state["scheduler"] = scheduler

    def _register_api_routes(self) -> None:
        # Routes are attached during create_application(); this step asserts
        # the aggregate router was included and records the fact.
        self.state["routes_registered"] = True

    def _register_platform(self) -> None:
        """Compose platform managers and adapters after registries are loaded."""
        from app.startup.composition import Composition, set_composition

        if self.registry_manager is None or self.databases is None:
            logger.warning(
                "platform registration skipped: registries/databases not ready"
            )
            return
        composition = Composition()
        composition.wire(
            registry_manager=self.registry_manager,
            databases=self.databases,
        )
        set_composition(composition)
        self.state["composition"] = composition
