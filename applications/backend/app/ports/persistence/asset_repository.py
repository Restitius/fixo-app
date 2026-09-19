"""AssetRepository — canonical persistence port for the asset aggregate.

Application/domain services depend on THIS protocol (dependency inversion).
Nothing here knows SQL, query IDs, or the query registry — the concrete SQL
adapter at `app/adapters/persistence/asset_sql_adapter.py` implements it.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class AssetRepository(Protocol):
    """Business persistence surface for owned assets."""

    async def get(self, user_id: str, asset_id: str) -> Any | None: ...

    async def add(self, params: dict[str, Any]) -> Any: ...

    async def update(self, user_id: str, params: dict[str, Any]) -> Any: ...

    async def archive(self, user_id: str, asset_id: str) -> Any: ...

    async def sell(self, user_id: str, asset_id: str, sale_payload: dict[str, Any]) -> Any: ...

    async def revalue(self, user_id: str, asset_id: str, new_value: Any, reason: str | None = None) -> Any: ...

    async def list(self, filters: dict[str, Any]) -> Any: ...

    async def summary(self, user_id: str) -> Any: ...