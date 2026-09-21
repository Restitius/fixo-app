"""MatchingRepository — persistence port for match candidates.

CUS.MATCH.* IDs live only in MatchingSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class MatchingRepository(Protocol):
    async def search_candidates(
        self, *, service_id: str, customer_id: str,
        city: str | None, region: str | None
    ) -> list[dict[str, Any]]: ...
    async def save_candidate(
        self, request_id: str, candidate: dict[str, Any]
    ) -> dict[str, Any] | None: ...
    async def list_matches(self, customer_id: str, request_id: str) -> list[dict[str, Any]]: ...