"""Provider Arrival SQL adapter (Requirement Phase 19)."""
from __future__ import annotations

import logging
from typing import Any

from app.ports.persistence.provider_arrival_repository import ProviderArrivalRepository

logger = logging.getLogger(__name__)


class ProviderArrivalQueryIds:
    ARRIVE = "PROV.ARRIVAL.ARRIVE"
    VERIFY_PIN = "PROV.ARRIVAL.VERIFY_PIN"
    STATUS = "PROV.ARRIVAL.STATUS"


class ProviderArrivalSqlAdapter(ProviderArrivalRepository):
    """SQL adapter for provider arrival."""

    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def arrive(
        self, provider_id: str, booking_id: str, latitude: float, longitude: float
    ) -> Any | None:
        return await self._sql.execute(
            ProviderArrivalQueryIds.ARRIVE,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "latitude": latitude,
                "longitude": longitude,
            },
            fetch="one",
        )

    async def verify_pin(self, provider_id: str, booking_id: str, code: str) -> Any | None:
        return await self._sql.execute(
            ProviderArrivalQueryIds.VERIFY_PIN,
            {"user_id": provider_id, "booking_id": booking_id, "code": code},
            fetch="one",
        )

    async def status(self, provider_id: str, booking_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderArrivalQueryIds.STATUS,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )
