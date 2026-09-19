"""TransactionSummaryResource — aggregate/read-model representation."""
from __future__ import annotations

from typing import Any


class TransactionSummaryResource:
    @staticmethod
    def to_resource(summary: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("TransactionSummaryResource.to_resource")
