"""ProviderPayoutSqlAdapter — implemented via governed queries (Phase 30).

The only code that knows PROV.PAYOUT.* query ids. Payout methods and the
withdraw lifecycle both flow through here; withdraw/cancel are atomic
(wallet reserve + ledger + payout row in one statement).
"""
from __future__ import annotations

from typing import Any


class ProviderPayoutQueryIds:
    METHOD_ADD = "PROV.PAYOUT.METHODS.ADD"
    METHODS_LIST = "PROV.PAYOUT.METHODS.LIST"
    METHOD_SET_DEFAULT = "PROV.PAYOUT.METHODS.SET_DEFAULT"
    METHOD_DELETE = "PROV.PAYOUT.METHODS.DELETE"
    WITHDRAW = "PROV.PAYOUT.WITHDRAW"
    LIST = "PROV.PAYOUT.LIST"
    GET = "PROV.PAYOUT.GET"
    CANCEL = "PROV.PAYOUT.CANCEL"


class ProviderPayoutSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def add_method(
        self, provider_id: str, *, method_type: str, provider_name: str | None,
        account_holder: str | None, account_number: str | None,
        mobile_number: str | None, currency: str, is_default: bool,
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderPayoutQueryIds.METHOD_ADD,
            {
                "user_id": provider_id,
                "method_type": method_type,
                "provider_name": provider_name,
                "account_holder": account_holder,
                "account_number": account_number,
                "mobile_number": mobile_number,
                "currency": currency,
                "is_default": is_default,
            },
            fetch="one",
        )

    async def list_methods(self, provider_id: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderPayoutQueryIds.METHODS_LIST,
            {"user_id": provider_id},
            fetch="all",
        )
        return list(rows or [])

    async def set_default_method(
        self, provider_id: str, method_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderPayoutQueryIds.METHOD_SET_DEFAULT,
            {"user_id": provider_id, "method_id": method_id},
            fetch="one",
        )

    async def delete_method(
        self, provider_id: str, method_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderPayoutQueryIds.METHOD_DELETE,
            {"user_id": provider_id, "method_id": method_id},
            fetch="one",
        )

    async def withdraw(
        self, provider_id: str, *, method_id: str, amount: float,
        currency: str,
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderPayoutQueryIds.WITHDRAW,
            {
                "user_id": provider_id,
                "method_id": method_id,
                "amount": amount,
                "currency": currency,
            },
            fetch="one",
        )

    async def list(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderPayoutQueryIds.LIST,
            {"user_id": provider_id, "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])

    async def get(
        self, provider_id: str, payout_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderPayoutQueryIds.GET,
            {"user_id": provider_id, "payout_id": payout_id},
            fetch="one",
        )

    async def cancel(
        self, provider_id: str, payout_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderPayoutQueryIds.CANCEL,
            {"user_id": provider_id, "payout_id": payout_id},
            fetch="one",
        )