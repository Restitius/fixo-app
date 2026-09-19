"""CLI command: Rebuild cached period summaries (TRANSACTION.SUMMARY)."""
from __future__ import annotations

COMMAND_NAME = "domains.refresh_transaction_summaries"


def run(args=None) -> int:
    raise NotImplementedError("RefreshTransactionSummaries.run")
