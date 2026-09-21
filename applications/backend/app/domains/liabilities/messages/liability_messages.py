"""LiabilityMessages — user-facing copy catalog."""
from __future__ import annotations

MESSAGES: dict[str, dict[str, str]] = {
    "created": {"title": "Liability added", "body": "Your liability has been recorded."},
    "updated": {"title": "Liability updated", "body": "Your liability changes were saved."},
    "settled": {"title": "Liability cleared", "body": "Congratulations - this liability is fully repaid."},
    "restructured": {"title": "Terms updated", "body": "The liability terms were restructured."},
    "listed": {"title": "Liabilities loaded", "body": "Your outstanding debts are ready."},
}


def get(action: str) -> dict[str, str]:
    return MESSAGES.get(action, {"title": "Success", "body": ""})
