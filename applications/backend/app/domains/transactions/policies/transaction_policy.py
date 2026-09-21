"""TransactionPolicy — authorization questions for transactions operations."""
from __future__ import annotations

from typing import Any


class TransactionPolicy:
    @staticmethod
    def can_view(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("TransactionPolicy.can_view")

    @staticmethod
    def can_mutate(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("TransactionPolicy.can_mutate")
