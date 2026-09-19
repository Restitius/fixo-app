"""ProviderJobEvidenceRepository — persistence port for provider job evidence.

PROV.EVIDENCE.* IDs live only in ProviderJobEvidenceSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderJobEvidenceRepository(Protocol):
    async def add(
        self,
        provider_id: str,
        booking_id: str,
        phase: str,
        kind: str,
        title: str | None,
        body: str | None,
        media_url: str | None,
        quantity: float | None,
        unit: str | None,
    ) -> dict[str, Any] | None: ...

    async def list_for_booking(
        self,
        provider_id: str,
        booking_id: str,
        phase: str | None = None,
        kind: str | None = None,
    ) -> list[dict[str, Any]]: ...

    async def delete(
        self, provider_id: str, evidence_id: str
    ) -> dict[str, Any] | None: ...

    async def summary(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]: ...
