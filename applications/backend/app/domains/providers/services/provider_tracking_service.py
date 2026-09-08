"""ProviderTrackingService — navigation & live location (Requirement Phase 18).

Provider-side trip lifecycle:
    start_trip → stream location updates (+ record trace) → end_trip.
Provider reads customer address for navigation; customer reads provider's
live position. All operations are provider_id-scoped at the query layer.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class ProviderTrackingService:
    def __init__(self, tracking: Any) -> None:
        self._tracking = tracking

    async def start_trip(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        row = await self._tracking.start_trip(provider_id, booking_id)
        if not row:
            raise ValidationError("Cannot start trip — booking not in CONFIRMED state or not assigned to you")
        logger.info("provider %s started trip for booking %s", provider_id, booking_id)
        return {"booking_id": row["booking_id"], "trip_started_at": row["trip_started_at"]}

    async def update_location(
        self,
        provider_id: str,
        booking_id: str,
        latitude: float,
        longitude: float,
        eta_minutes: int | None = None,
    ) -> dict[str, Any]:
        row = await self._tracking.update_location(
            provider_id, booking_id, latitude, longitude, eta_minutes
        )
        if not row:
            raise ValidationError("Cannot update location — trip not active or not assigned to you")
        return {
            "booking_id": row["booking_id"],
            "current_latitude": float(row["current_latitude"]),
            "current_longitude": float(row["current_longitude"]),
            "eta_minutes": row["eta_minutes"],
        }

    async def record_location(
        self, booking_id: str, latitude: float, longitude: float
    ) -> dict[str, Any]:
        row = await self._tracking.record_location(booking_id, latitude, longitude)
        if not row:
            raise ValidationError("Could not record the position ping")
        return {"location_id": row["location_id"], "recorded_at": row["recorded_at"]}

    async def end_trip(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        row = await self._tracking.end_trip(provider_id, booking_id)
        if not row:
            raise ValidationError("Cannot end trip — trip not active or not assigned to you")
        logger.info("provider %s ended trip for booking %s", provider_id, booking_id)
        return {"booking_id": row["booking_id"], "trip_ended_at": row["trip_ended_at"]}

    async def get_location(self, booking_id: str) -> dict[str, Any]:
        row = await self._tracking.get_location(booking_id)
        if not row:
            raise NotFoundError("No active trip found for this booking")
        return {
            "booking_id": row["booking_id"],
            "provider_name": row["provider_name"],
            "provider_headline": row["provider_headline"],
            "current_latitude": float(row["current_latitude"]) if row["current_latitude"] else None,
            "current_longitude": float(row["current_longitude"]) if row["current_longitude"] else None,
            "eta_minutes": row["eta_minutes"],
            "trip_started_at": row["trip_started_at"],
        }

    async def get_nav_info(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        row = await self._tracking.get_nav_info(provider_id, booking_id)
        if not row:
            raise NotFoundError("Booking not found or not assigned to you")
        return {
            "booking_id": row["booking_id"],
            "scheduled_date": str(row["scheduled_date"]),
            "time_window": row["time_window"],
            "customer_name": row["customer_name"],
            "customer_phone": row["customer_phone"],
            "address": {
                "street": row["street_address"],
                "city": row["city"],
                "region": row["region"],
                "latitude": float(row["address_latitude"]) if row["address_latitude"] else None,
                "longitude": float(row["address_longitude"]) if row["address_longitude"] else None,
            },
            "provider_latitude": float(row["provider_latitude"]) if row["provider_latitude"] else None,
            "provider_longitude": float(row["provider_longitude"]) if row["provider_longitude"] else None,
            "eta_minutes": row["eta_minutes"],
        }
