"""ProviderReadPort — read-only provider directory access.

Module 14 (Provider Profile) consumes this; CUS.PROVIDER.* IDs live in
ProviderReadAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderReadPort(Protocol):
    async def profile(self, provider_id: str) -> dict[str, Any] | None: ...
    async def list_by_service(self, slug: str) -> list[dict[str, Any]]: ...