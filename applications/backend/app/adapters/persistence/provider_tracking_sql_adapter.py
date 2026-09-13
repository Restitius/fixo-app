"""ProviderTrackingSqlAdapter — provider trip tracking (Requirement Phase 18).

Mirrors the customer-facing TrackingSqlAdapter but uses provider-scoped
queries (PROV.TRIP.*) that assert provider_id = :user_id ownership.
"""
from __future__ import annotations

import json
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderTripQueryIds:
    START = "PROV.TRIP.START"
    UPDATE_LOCATION = "PROV.TRIP.UPDATE_LOCATION"
    RECORD_LOCATION = "PROV.TRIP.RECORD_LOCATION"
    END_TRIP = "PROV.TRIP.END"
    GET_LOCATION = "PROV.TRIP.GET_LOCATION"
    GET_NAV_INFO = "PROV.TRIP.GET_NAV_INFO"


class ProviderTrackingSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def start_trip(self, provider_id: str, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderTripQueryIds.START,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )

    async def update_location(
        self, provider_id: str, booking_id: str, latitude: float, longitude: float, eta_minutes: int | None
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderTripQueryIds.UPDATE_LOCATION,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "latitude": latitude,
                "longitude": longitude,
                "eta_minutes": eta_minutes,
            },
            fetch="one",
        )

    async def record_location(
        self, provider_id: str, booking_id: str, latitude: float, longitude: float
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderTripQueryIds.RECORD_LOCATION,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "latitude": latitude,
                "longitude": longitude,
            },
            fetch="one",
        )

    async def end_trip(self, provider_id: str, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderTripQueryIds.END_TRIP,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )

    async def get_location(self, booking_id: str, customer_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderTripQueryIds.GET_LOCATION,
            {"booking_id": booking_id, "customer_id": customer_id},
            fetch="one",
        )

    async def get_nav_info(self, provider_id: str, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderTripQueryIds.GET_NAV_INFO,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )
