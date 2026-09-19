"""Transactions module screens."""
from __future__ import annotations

from app.registries.screens.screen_definition import ScreenDefinition

SCREEN_TRANSACTIONS_LIST = ScreenDefinition(
    id="SCR-TRX-001",
    name="Transactions List",
    module="transactions",
    route="/transactions",
    permission="transactions.view",
    description="Filtered transaction ledger with period summaries.",
)

SCREEN_TRANSACTION_DETAIL = ScreenDefinition(
    id="SCR-TRX-002",
    name="Transaction Detail",
    module="transactions",
    route="/transactions/:transaction_id",
    permission="transactions.view",
    description="Single transaction view with settlement actions.",
)

ALL: tuple[ScreenDefinition, ...] = (SCREEN_TRANSACTIONS_LIST, SCREEN_TRANSACTION_DETAIL)
