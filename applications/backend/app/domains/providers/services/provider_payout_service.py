"""ProviderPayoutService — payout management (Requirement Phase 30).

Providers register payout methods (bank account, mobile money, provider
wallet or other supported channels) with account holder, provider, account
number, mobile number, currency — then request withdrawals from their
wallet's available balance.

Payout lifecycle: REQUESTED -> PROCESSING -> PAID | FAILED
(provider may CANCELLED while REQUESTED). Requesting a withdrawal
atomically reserves the money on the wallet (available -> reserved) and
writes a WITHDRAWAL ledger entry; cancelling releases it back.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import (
    AuthorizationError,
    NotFoundError,
    ValidationError,
)

METHOD_TYPES = frozenset({"BANK", "MOBILE_MONEY", "WALLET", "OTHER"})
CURRENCIES = frozenset({"TZS", "KES", "UGX", "USD", "EUR", "GBP"})


class ProviderPayoutService:
    """Domain service for payout methods + withdrawals."""

    def __init__(self, payouts: Any) -> None:
        self._payouts = payouts
# -- payout methods --------------------------------------------------------

    async def add_method(
        self,
        provider_id: str,
        *,
        method_type: str,
        provider_name: str | None = None,
        account_holder: str | None = None,
        account_number: str | None = None,
        mobile_number: str | None = None,
        currency: str = "TZS",
        is_default: bool = False,
    ) -> dict[str, Any]:
        method_type = (method_type or "").strip().upper()
        if method_type not in METHOD_TYPES:
            raise ValidationError(
                f"method_type must be one of: {', '.join(sorted(METHOD_TYPES))}"
            )
        currency = (currency or "TZS").strip().upper()
        if currency not in CURRENCIES:
            raise ValidationError(
                f"currency must be one of: {', '.join(sorted(CURRENCIES))}"
            )

        if method_type == "BANK":
            if not (account_holder and account_number):
                raise ValidationError(
                    "account_holder and account_number are required for BANK"
                )
        elif method_type == "MOBILE_MONEY":
            if not (provider_name and mobile_number):
                raise ValidationError(
                    "provider_name and mobile_number are required for MOBILE_MONEY"
                )
        elif method_type == "OTHER" and not provider_name:
            raise ValidationError("provider_name is required for OTHER")

        row = await self._payouts.add_method(
            provider_id,
            method_type=method_type,
            provider_name=provider_name,
            account_holder=account_holder,
            account_number=account_number,
            mobile_number=mobile_number,
            currency=currency,
            is_default=is_default,
        )
        if row is None:
            raise ValidationError(
                f"A {method_type} payout method already exists for this provider"
            )
        return self._encode_method(row)

    async def list_methods(self, provider_id: str) -> list[dict[str, Any]]:
        rows = await self._payouts.list_methods(provider_id)
        return [self._encode_method(m) for m in rows]

    async def set_default_method(
        self, provider_id: str, method_id: str
    ) -> dict[str, Any]:
        row = await self._payouts.set_default_method(provider_id, method_id)
        if row is None:
            raise NotFoundError("Payout method not found")
        return {"method_id": str(row.get("method_id") or ""), "is_default": True}

    async def delete_method(
        self, provider_id: str, method_id: str
    ) -> dict[str, Any]:
        row = await self._payouts.delete_method(provider_id, method_id)
        if row is None:
            raise NotFoundError("Payout method not found")
        return {"method_id": str(row.get("method_id") or "")}

    # -- withdrawals -------------------------------------------------------------

    async def withdraw(
        self,
        provider_id: str,
        *,
        method_id: str,
        amount: float,
        currency: str = "TZS",
    ) -> dict[str, Any]:
        currency = (currency or "TZS").strip().upper()
        if currency not in CURRENCIES:
            raise ValidationError(
                f"currency must be one of: {', '.join(sorted(CURRENCIES))}"
            )
        if amount is None or amount <= 0:
            raise ValidationError("amount must be greater than 0")

        row = await self._payouts.withdraw(
            provider_id,
            method_id=method_id,
            amount=float(amount),
            currency=currency,
        )
        if row is None:
            raise AuthorizationError(
                "Insufficient available balance or payout method not found"
            )
        return self._encode_payout(row)

    async def list(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> dict[str, Any]:
        if limit < 1 or limit > 100:
            raise ValidationError("limit must be between 1 and 100")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._payouts.list(provider_id, limit=limit, offset=offset)
        return {
            "payouts": [self._encode_payout(p) for p in rows],
            "limit": limit,
            "offset": offset,
        }

    async def get(self, provider_id: str, payout_id: str) -> dict[str, Any]:
        row = await self._payouts.get(provider_id, payout_id)
        if row is None:
            raise NotFoundError("Payout not found")
        return self._encode_payout(row)

    async def cancel(self, provider_id: str, payout_id: str) -> dict[str, Any]:
        row = await self._payouts.cancel(provider_id, payout_id)
        if row is None:
            raise AuthorizationError(
                "Cannot cancel — payout must be REQUESTED and owned by this provider"
            )
        return {
            "payout_id": str(row.get("payout_id") or ""),
            "payout_number": str(row.get("payout_number") or ""),
            "amount": float(row.get("amount") or 0),
            "currency": str(row.get("currency") or ""),
            "status": str(row.get("status") or ""),
        }