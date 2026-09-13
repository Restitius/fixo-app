"""Provider business-customers persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderBusinessCustomersRepositoryPort(Protocol):
    async def create(
        self,
        provider_id: str,
        *,
        customer_id: str,
        company_name: str | None,
        negotiated_rate_type: str,
        negotiated_rate_value: float,
        notes: str | None,
    ) -> dict[str, Any] | None:
        ...

    async def list_customers(
        self, provider_id: str, *, status: str | None = None, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        ...

    async def get(self, provider_id: str, *, record_id: str) -> dict[str, Any] | None:
        ...

    async def update(
        self,
        provider_id: str,
        *,
        record_id: str,
        company_name: str | None = None,
        negotiated_rate_type: str | None = None,
        negotiated_rate_value: float | None = None,
        notes: str | None = None,
    ) -> dict[str, Any] | None:
        ...

    async def deactivate(self, provider_id: str, *, record_id: str) -> dict[str, Any] | None:
        ...
