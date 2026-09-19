"""ProviderPayoutRepository — persistence port for payout management.

PROV.PAYOUT.* IDs live only in ProviderPayoutSqlAdapter. Phase 30 covers
payout-method registration (bank / mobile money / wallet / other) and the
withdraw lifecycle: REQUESTED -> PROCESSING -> PAID | FAILED | CANCELLED.
Withdraw/cancel are atomic (wallet + ledger + payout in one statement).
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderPayoutRepository(Protocol):
    async def add_method(
        self, provider_id: str, *, method_type: str, provider_name: str | None,
        account_holder: str | None, account_number: str | None,
        mobile_number: str | None, currency: str, is_default: bool,
    ) -> dict[str, Any] | None: ...

    async def list_methods(self, provider_id: str) -> list[dict[str, Any]]: ...

    async def set_default_method(
        self, provider_id: str, method_id: str
    ) -> dict[str, Any] | None: ...

    async def delete_method(
        self, provider_id: str, method_id: str
    ) -> dict[str, Any] | None: ...

    async def withdraw(
        self, provider_id: str, *, method_id: str, amount: float,
        currency: str,
    ) -> dict[str, Any] | None: ...

    async def list(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]: ...

    async def get(
        self, provider_id: str, payout_id: str
    ) -> dict[str, Any] | None: ...

    async def cancel(
        self, provider_id: str, payout_id: str
    ) -> dict[str, Any] | None: ...