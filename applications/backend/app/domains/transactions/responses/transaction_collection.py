"""TransactionCollection — shapes MANY transaction rows."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any


class TransactionCollection:
    @staticmethod
    def to_resources(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
        raise NotImplementedError("TransactionCollection.to_resources")
