"""AssetMessages — user-facing copy catalog (single source of truth)."""
from __future__ import annotations

MESSAGES: dict[str, dict[str, str]] = {
    "created": {"title": "Asset created", "body": "Your asset has been created successfully."},
    "updated": {"title": "Asset updated", "body": "Your asset changes were saved."},
    "sold": {"title": "Asset sold", "body": "The sale was recorded successfully."},
    "revalued": {"title": "Asset revalued", "body": "The new valuation was recorded."},
    "archived": {"title": "Asset archived", "body": "The asset was moved to your archive."},
    "listed": {"title": "Assets loaded", "body": "Your portfolio is ready."},
}


def get(action: str) -> dict[str, str]:
    """Message lookup with safe fallback."""
    return MESSAGES.get(action, {"title": "Success", "body": ""})
