"""UserResource — shapes ONE user row for the API."""
from __future__ import annotations

from typing import Any


class UserResource:
    @staticmethod
    def to_resource(row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("UserResource.to_resource")
