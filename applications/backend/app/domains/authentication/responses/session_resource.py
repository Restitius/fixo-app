"""AuthenticationResource — shapes ONE session row for the API."""
from __future__ import annotations

from typing import Any


class AuthenticationResource:
    @staticmethod
    def to_resource(row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("AuthenticationResource.to_resource")
