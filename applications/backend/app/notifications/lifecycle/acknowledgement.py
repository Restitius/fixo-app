"""Acknowledgement tracking — unread/acked state per notification."""
from __future__ import annotations


class AcknowledgementTracker:
    async def mark_acknowledged(self, notification_id: str, actor_id: str) -> None:
        raise NotImplementedError("AcknowledgementTracker.mark_acknowledged")

    async def unread_count(self, recipient_id: str) -> int:
        raise NotImplementedError("AcknowledgementTracker.unread_count")
