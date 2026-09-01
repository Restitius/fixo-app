"""Wallet service — ledger-backed balance operations (Module 34)."""
from __future__ import annotations
from typing import Any

from app.ports.persistence.value_ports import WalletRepositoryPort


class WalletService:
    def __init__(self, repo: WalletRepositoryPort) -> None:
        self._repo = repo

    async def _wallet(self, customer_id: str) -> dict[str, Any]:
        row = await self._repo.get_balance(customer_id) or await self._repo.ensure(customer_id)
        if not row:
            raise RuntimeError("Wallet could not be provisioned")
        return row

    async def balance(self, customer_id: str) -> dict[str, Any]:
        return await self._wallet(customer_id)

    async def transactions(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        await self._wallet(customer_id)
        return await self._repo.list_transactions(customer_id, limit, offset)

    async def credit(self, customer_id: str, amount: float) -> dict[str, Any]:
        if amount <= 0:
            raise ValueError("Credit amount must be positive")
        await self._wallet(customer_id)
        row = await self._repo.credit(customer_id, amount)
        if not row:
            raise RuntimeError("Credit failed")
        return row

    async def debit(self, customer_id: str, amount: float) -> dict[str, Any]:
        if amount <= 0:
            raise ValueError("Debit amount must be positive")
        wallet = await self._wallet(customer_id)
        if float(wallet["balance"]) < amount:
            raise ValueError("Insufficient wallet balance")
        row = await self._repo.debit(customer_id, amount)
        if not row:
            raise ValueError("Insufficient wallet balance")
        return row