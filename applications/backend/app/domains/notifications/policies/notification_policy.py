"""NotificationPolicy — authorization questions for notifications operations."""
from __future__ import annotations

from typing import Any


class NotificationPolicy:
    @staticmethod
    def can_view(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("NotificationPolicy.can_view")

    @staticmethod
    def can_mutate(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("NotificationPolicy.can_mutate")
