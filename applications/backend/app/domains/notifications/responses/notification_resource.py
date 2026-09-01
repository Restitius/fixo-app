"""NotificationResource — shapes ONE notification row for the API."""
from __future__ import annotations

from typing import Any


class NotificationResource:
    @staticmethod
    def to_resource(row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("NotificationResource.to_resource")
