"""Asset categories accepted by the API (mirrors the CK_ASSET_TYPE constraint)."""
from __future__ import annotations

ASSET_TYPES = ("appliance", "hvac", "plumbing", "electrical", "furniture", "security", "other")


def normalize_asset_type(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().lower()
    if cleaned not in ASSET_TYPES:
        raise ValueError(f"asset type must be one of: {', '.join(ASSET_TYPES)}")
    return cleaned
