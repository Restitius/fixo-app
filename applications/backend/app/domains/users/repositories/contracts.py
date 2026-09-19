"""Repository CONTRACT for users (dependency inversion boundary)."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class UserRepository(Protocol):
    async def get(self, user_id: str, entity_id: int) -> Any | None: ...

    async def list(self, filters: dict[str, Any]) -> Any: ...
