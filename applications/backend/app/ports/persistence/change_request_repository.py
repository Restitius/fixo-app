"""ChangeRequestRepository — persistence port for Module 24.

CUS.CHANGE.* IDs live only in ChangeRequestSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ChangeRequestRepository(Protocol):
    async def create(
        self, customer_id: str, booking_id: str, params: dict[str, Any]
    ) -> dict[str, Any] | None: ...
    async def list_for_booking(
        self, customer_id: str, booking_id: str
    ) -> list[dict[str, Any]]: ...
    async def get_owned(
        self, customer_id: str, change_id: str
    ) -> dict[str, Any] | None: ...
    async def decide(
        self, change_id: str, *, decision: str
    ) -> dict[str, Any] | None: ...