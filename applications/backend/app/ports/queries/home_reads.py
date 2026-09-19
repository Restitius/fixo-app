"""Home read ports — what the Home aggregator is ALLOWED to know.

Per architecture section 53: HomeService composes sections through these
ports and NEVER joins other domains' tables. Each port is implemented by an
adapter in app/adapters/persistence/home_read_adapter.py; sections whose
domains land in later phases resolve to safe empty payloads there.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class EnvironmentReadPort(Protocol):
    """Counts + default-address flag for this customer's environment."""

    async def summary(self, customer_id: str) -> dict[str, Any]: ...


@runtime_checkable
class CatalogReadPort(Protocol):
    """Curated catalog slices for discovery surfaces."""

    async def categories(self, customer_id: str, limit: int = 8) -> list[dict[str, Any]]: ...
    async def popular_services(self, customer_id: str, limit: int = 6) -> list[dict[str, Any]]: ...


@runtime_checkable
class ActiveBookingReadPort(Protocol):
    """In-flight bookings for dashboard cards. Wired in Phase 7."""

    async def active(self, customer_id: str, limit: int = 3) -> list[dict[str, Any]]: ...


@runtime_checkable
class WalletReadPort(Protocol):
    """Wallet balance teaser. Wired in Phase 12."""

    async def balance(self, customer_id: str) -> dict[str, Any]: ...


@runtime_checkable
class NotificationReadPort(Protocol):
    """Unread badge data. Wired in Phase 14."""

    async def unread_count(self, customer_id: str) -> int: ...


@runtime_checkable
class RecommendationReadPort(Protocol):
    """Personalised suggestions. Placeholder until Phase 3 search lands."""

    async def for_customer(self, customer_id: str, limit: int = 3) -> list[dict[str, Any]]: ...