"""UserPolicy — authorization questions for users operations."""
from __future__ import annotations

from typing import Any


class UserPolicy:
    @staticmethod
    def can_view(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("UserPolicy.can_view")

    @staticmethod
    def can_mutate(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("UserPolicy.can_mutate")
