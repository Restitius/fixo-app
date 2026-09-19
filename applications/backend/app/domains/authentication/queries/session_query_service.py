"""AuthenticationQueryService — governed persistence for authentication (no SQL here).

STATUS: AUTH.* statements are not yet present in app/queries/registry.yaml.
Methods below fail fast with a clear roadmap error until SQL + manifest land.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class AuthenticationQueryService:
    def __init__(self, executor: Any) -> None:
        self._executor = executor

    async def find(self, user_id: str, entity_id: int) -> Any:
        raise NotImplementedFeatureError(
            "Governed query AUTH.GET_BY_ID not registered yet - "
            "add SQL + registry.yaml entry first"
        )

    async def list(self, filters: dict[str, Any]) -> Any:
        raise NotImplementedFeatureError(
            "Governed query AUTH.LIST not registered yet - "
            "add SQL + registry.yaml entry first"
        )
