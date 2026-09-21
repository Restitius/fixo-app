"""Provider Arrival repository port (Requirement Phase 19)."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderArrivalRepository(ABC):
    """Port for provider arrival operations."""

    @abstractmethod
    async def arrive(
        self, booking_id: str, latitude: float, longitude: float
    ) -> Any | None:
        """Record provider arrival with GPS. Returns row or None if preconditions fail."""
        ...

    @abstractmethod
    async def verify_pin(self, booking_id: str, code: str) -> Any | None:
        """Verify the customer's job PIN. Returns row or None if code wrong."""
        ...

    @abstractmethod
    async def status(self, booking_id: str) -> Any | None:
        """Get arrival state for a booking."""
        ...
