"""NotificationSummaryResource — aggregate/read-model representation."""
from __future__ import annotations

from typing import Any


class NotificationSummaryResource:
    @staticmethod
    def to_resource(summary: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("NotificationSummaryResource.to_resource")
