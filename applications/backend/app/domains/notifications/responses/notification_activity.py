"""NotificationActivityResource — history/timeline item shape."""
from __future__ import annotations

from typing import Any


class NotificationActivityResource:
    @staticmethod
    def to_resource(activity_row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("NotificationActivityResource.to_resource")
