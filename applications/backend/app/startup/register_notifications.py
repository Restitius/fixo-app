"""Notification registration — catalogue NTF-* notification definitions.

Imports every domains/*/notifications/*.py module (skipping __init__) and
registers a NotificationDefinition per NOTIFICATION_KEY found. Tolerant of
both the current shape (CATEGORY, RECIPIENTS, CHANNELS as a dict keyed by
recipient type) and the pre-existing shape used by the first definitions
written (a flat CHANNELS tuple, no RECIPIENTS/CATEGORY) so nothing needs to
be rewritten just to become registered.
"""
from __future__ import annotations

import importlib
import logging
import pkgutil
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def _normalize_channels(raw_channels: Any, recipients: tuple[str, ...]) -> dict[str, tuple[str, ...]]:
    if isinstance(raw_channels, dict):
        return {str(k): tuple(v) for k, v in raw_channels.items()}
    if raw_channels:
        return {r: tuple(raw_channels) for r in recipients}
    return {r: ("database",) for r in recipients}


def register_notifications(notification_registry: Any) -> None:
    """Register notification definitions from every domain."""
    from app.definitions.notifications.service_lifecycle import NOTIFICATION_DEFINITIONS
    from app.registries.notifications.notification_definition import NotificationDefinition

    domains_root = Path(__file__).resolve().parent.parent / "domains"
    count = 0
    for notifications_dir in sorted(domains_root.glob("*/notifications")):
        domain_name = notifications_dir.parent.name
        package = f"app.domains.{domain_name}.notifications"
        for module_info in pkgutil.iter_modules([str(notifications_dir)]):
            if module_info.name.startswith("_"):
                continue
            module = importlib.import_module(f"{package}.{module_info.name}")
            key = getattr(module, "NOTIFICATION_KEY", None)
            if not key:
                continue
            recipients = tuple(getattr(module, "RECIPIENTS", ("customer",)))
            definition = NotificationDefinition(
                key=key,
                category=getattr(module, "CATEGORY", "GENERAL"),
                recipients=recipients,
                channels=_normalize_channels(getattr(module, "CHANNELS", None), recipients),
                required_data=tuple(getattr(module, "REQUIRED_DATA", ())),
                title_template=getattr(module, "TITLE_TEMPLATE", None),
                body_template=getattr(module, "BODY_TEMPLATE", None),
            )
            notification_registry.register(key, definition)
            count += 1
    for definition in NOTIFICATION_DEFINITIONS:
        notification_registry.register(definition.key, definition)
        count += 1
    logger.info("notification registry loaded: %s definitions", count)
