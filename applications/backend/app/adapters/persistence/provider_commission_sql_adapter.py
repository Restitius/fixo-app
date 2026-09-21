"""ProviderCommissionSqlAdapter — implemented via governed queries (Phase 31).

The only code that knows PROV.COMMISSION.* query ids. Commission/fee flows are
read-only configuration lookup plus an audit-immutable fee-application write;
all provider ownership is enforced in SQL.
"""
from __future__ import annotations

from typing import Any


class ProviderCommissionQueryIds:
    RATE = "PROV.COMMISSION.RATE"
    FEES_APPLY = "PROV.COMMISSION.FEES.APPLY"
    FEES_LIST = "PROV.COMMISSION.FEES.LIST"
    FEES_SUMMARY = "PROV.COMMISSION.FEES.SUMMARY"


class ProviderCommissionSqlAdapter:
    """SQL-facing adapter for provider commission/fee operations."""

    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def rate(self, provider_id: str, currency: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderCommissionQueryIds.RATE,
            {"user_id": provider_id, "currency": currency},
            fetch="one",
        )

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
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderCommissionQueryIds.FEES_APPLY,
            {
                "user_id": provider_id,
                "currency": currency,
                "gross_amount": gross_amount,
                "commission_amount": commission_amount,
                "tax_amount": tax_amount,
                "net_amount": net_amount,
                "reference_type": reference_type,
                "reference_id": reference_id,
                "description": description,
            },
            fetch="one",
        )

    async def list_fees(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return list(
            await self._sql.execute(
                ProviderCommissionQueryIds.FEES_LIST,
                {
                    "user_id": provider_id,
                    "status": status,
                    "limit": limit,
                    "offset": offset,
                },
                fetch="all",
            )
            or []
        )

    async def fee_summary(self, provider_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderCommissionQueryIds.FEES_SUMMARY,
            {"user_id": provider_id},
            fetch="one",
        )
