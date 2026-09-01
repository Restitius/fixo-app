"""AuthenticationPolicy — authorization questions for authentication operations."""
from __future__ import annotations

from typing import Any


class AuthenticationPolicy:
    @staticmethod
    def can_view(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("AuthenticationPolicy.can_view")

    @staticmethod
    def can_mutate(principal: Any, entity: Any) -> bool:
        raise NotImplementedError("AuthenticationPolicy.can_mutate")
