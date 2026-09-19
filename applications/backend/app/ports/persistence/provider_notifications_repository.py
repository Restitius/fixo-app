"""ProviderNotificationsRepository — provider notifications (Requirement Phase 37).

Manages provider-facing notification rows: list with filters, fetch single,
mark read (idempotent), and count unread.

Channels: in_app, email, sms.
Categories: booking, payout, review, system, etc.
"""

from __future__ import annotations

from abc import abstractmethod
from typing import Any, Protocol


class ProviderNotificationsRepository(Protocol):
    @abstractmethod
    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]: ...

    @abstractmethod
    async def get(self, provider_id: str, *, notification_id: str) -> Any | None: ...

    @abstractmethod
    async def mark_read(self, provider_id: str, *, notification_id: str) -> Any | None: ...

    @abstractmethod
    async def unread_count(self, provider_id: str) -> int: ...