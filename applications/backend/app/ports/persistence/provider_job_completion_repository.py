"""ProviderJobCompletionRepository — persistence port for provider job completion.

PROV.COMPLETION.* IDs live only in ProviderJobCompletionSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderJobCompletionRepository(Protocol):
    async def submit(
        self,
        provider_id: str,
        booking_id: str,
        params: dict[str, Any],
    ) -> dict[str, Any] | None: ...

    async def get(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None: ...
