"""TransactionResource — shapes ONE transaction row for the API."""
from __future__ import annotations

from typing import Any


class TransactionResource:
    @staticmethod
    def to_resource(row: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("TransactionResource.to_resource")
