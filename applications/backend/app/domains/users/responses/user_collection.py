"""UserCollection — shapes MANY user rows."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any


class UserCollection:
    @staticmethod
    def to_resources(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
        raise NotImplementedError("UserCollection.to_resources")
