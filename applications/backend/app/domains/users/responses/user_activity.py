"""UserActivityResource — history/timeline item shape."""
from __future__ import annotations

from typing import Any


class UserActivityResource:
    @staticmethod
    def to_resource(activity_row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("UserActivityResource.to_resource")
