"""Database channel — persists the notification row (in-app inbox)."""
from __future__ import annotations


class DatabaseChannel:
    name = "database"

    async def deliver(self, recipient_id: str, subject: str, body: str, meta: dict) -> bool:
        """INSERT via governed query NTF.PERSIST (implementation phase)."""
        raise NotImplementedError("DatabaseChannel.deliver")
