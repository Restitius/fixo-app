"""AddressRepository — persistence port for the location domain.

Application services depend on THIS protocol; CUS.LOCATION.* IDs live only
in LocationSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class AddressRepository(Protocol):
    async def list(self, customer_id: str) -> list[dict[str, Any]]: ...
    async def get(self, customer_id: str, address_id: str) -> dict[str, Any] | None: ...
    async def create(self, customer_id: str, params: dict[str, Any]) -> dict[str, Any] | None: ...
    async def update(
        self, customer_id: str, address_id: str, params: dict[str, Any]
    ) -> dict[str, Any] | None: ...
    async def delete(self, customer_id: str, address_id: str) -> bool: ...
    async def set_default(self, customer_id: str, address_id: str) -> bool: ...