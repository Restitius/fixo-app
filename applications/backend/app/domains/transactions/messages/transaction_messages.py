"""TransactionMessages — user-facing copy catalog."""
from __future__ import annotations

MESSAGES: dict[str, dict[str, str]] = {
    "created": {"title": "Transaction recorded", "body": "Your transaction has been recorded successfully."},
    "updated": {"title": "Transaction updated", "body": "Your transaction changes were saved."},
    "settled": {"title": "Transaction settled", "body": "The transaction was marked as settled."},
    "categorized": {"title": "Category updated", "body": "The transaction category was updated."},
    "listed": {"title": "Transactions loaded", "body": "Your transaction ledger is ready."},
}


def get(action: str) -> dict[str, str]:
    return MESSAGES.get(action, {"title": "Success", "body": ""})
