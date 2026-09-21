"""EvidenceRepository — persistence port for request evidence rows."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class EvidenceRepository(Protocol):
    async def add(
        self, customer_id: str, request_id: str, meta: dict[str, Any]
    ) -> dict[str, Any] | None: ...
    async def list(self, customer_id: str, request_id: str) -> list[dict[str, Any]]: ...
    async def delete(
        self, customer_id: str, request_id: str, evidence_id: str
    ) -> str | None:
        """Return the storage key of the deleted row (None if absent)."""

    async def count(self, customer_id: str, request_id: str) -> int: ...