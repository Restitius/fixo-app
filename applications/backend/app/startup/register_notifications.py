"""Notification registration — catalogue NTF-* notification definitions."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def register_notifications(notification_registry: Any) -> None:
    """Register notification definitions from all domains."""
    # TODO(domains): import domains/*/notifications modules and register.
    logger.info("notification registry ready (definitions arrive with domains)")
