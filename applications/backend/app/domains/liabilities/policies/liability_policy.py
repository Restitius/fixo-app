"""LiabilityPolicy — authorization questions for liabilities operations."""
from __future__ import annotations

from typing import Any


class LiabilityPolicy:
    @staticmethod
    def can_view(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("LiabilityPolicy.can_view")

    @staticmethod
    def can_mutate(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("LiabilityPolicy.can_mutate")
