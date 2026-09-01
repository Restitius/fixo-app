"""Deduplication policy — suppress repeat alerts within a window (section 18)."""
from __future__ import annotations

import hashlib
import json


class DeduplicationPolicy:
    """Fingerprint-based suppression backed by cache/DB (IO in impl phase)."""

    def fingerprint(self, key: str, payload: dict) -> str:
        """Stable hash of key+payload (pure)."""
        basis = json.dumps({"key": key, "payload": payload}, sort_keys=True, default=str)
        return hashlib.sha256(basis.encode()).hexdigest()

    async def should_send(self, fingerprint: str, window_seconds: int) -> bool:
        """False when an identical fingerprint was sent within the window."""
        raise NotImplementedError("DeduplicationPolicy.should_send")

    async def mark_sent(self, fingerprint: str, window_seconds: int) -> None:
        raise NotImplementedError("DeduplicationPolicy.mark_sent")
