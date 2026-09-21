"""NotificationCollection — shapes MANY notification rows."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any


class NotificationCollection:
    @staticmethod
    def to_resources(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
        raise NotImplementedError("NotificationCollection.to_resources")
