"""AuthenticationActivityResource — history/timeline item shape."""
from __future__ import annotations

from typing import Any


class AuthenticationActivityResource:
    @staticmethod
    def to_resource(activity_row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("AuthenticationActivityResource.to_resource")
