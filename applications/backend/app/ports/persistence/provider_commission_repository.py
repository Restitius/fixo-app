"""ProviderCommissionRepository — persistence port for commission & fees.

PROV.COMMISSION.* IDs live only in ProviderCommissionSqlAdapter. Phase 31
covers commission/fee configuration lookup and the audit-immutable commission/
fee application record: gross, commission, tax and net, with provider-scoped
ownership enforced in SQL.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderCommissionRepository(Protocol):
    """Persistence port for provider commission/fee operations."""

    async def rate(self, provider_id: str, currency: str) -> dict[str, Any] | None: ...

    async def apply_fee(
        self,
        provider_id: str,
        *,
        currency: str,
        gross_amount: float,
        commission_amount: float,
        tax_amount: float,
        net_amount: float,
        reference_type: str | None,
        reference_id: str | None,
        description: str | None,
    ) -> dict[str, Any] | None: ...

    async def list_fees(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]: ...

    async def fee_summary(self, provider_id: str) -> dict[str, Any] | None: ...
