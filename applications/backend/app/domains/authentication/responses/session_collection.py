"""AuthenticationCollection — shapes MANY session rows."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any


class AuthenticationCollection:
    @staticmethod
    def to_resources(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
        raise NotImplementedError("AuthenticationCollection.to_resources")
