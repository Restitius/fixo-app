"""ProviderDisputesRepository — provider-facing disputes (Requirement Phase 39).

Provider-owned dispute views: list disputes on their bookings with filters,
fetch a single dispute (ownership-scoped), list evidence, submit a provider
response to a dispute, and list responses already given.

Dispute resolution stays platform/admin-side in this phase; the provider can
see the dispute, its evidence, and respond (kind: acknowledgment /
explanation / refund_offer).
"""
from __future__ import annotations

from abc import abstractmethod
from typing import Any, Protocol


class ProviderDisputesRepository(Protocol):
    @abstractmethod
    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        booking_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]: ...

    @abstractmethod
    async def get(self, provider_id: str, *, dispute_id: str) -> Any | None: ...

    @abstractmethod
    async def list_evidence(self, provider_id: str, *, dispute_id: str) -> list[Any]: ...

    @abstractmethod
    async def respond(
        self, provider_id: str, *, dispute_id: str, kind: str, body: str
    ) -> Any | None: ...

    @abstractmethod
    async def list_responses(self, provider_id: str, *, dispute_id: str) -> list[Any]: ...