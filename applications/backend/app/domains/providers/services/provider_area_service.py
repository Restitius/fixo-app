"""ProviderServiceAreaService — where the provider operates (Provider Req Phase 8).

Owns the service-area rules: LOCATION-based entries (country/region/city/
district/ward/neighborhood), RADIUS-based entries ("within N km of my
location"), the travel policy (max travel distance, travel fee, free travel
radius) and excluded areas. Persistence goes through
ProviderServiceAreaRepository; these tables are the data source the matching
engine (Provider Req Phase 12) will consume.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

_AREA_TYPES = ("LOCATION", "RADIUS")
_LOCATION_FIELDS = ("country", "region", "city", "district", "ward", "neighborhood")


class ProviderServiceAreaService:
    """Owns service-area entries, exclusions and the travel policy."""

    def __init__(self, areas: Any, events: Any = None) -> None:
        self._areas = areas
        self._events = events

    # -- queries ---------------------------------------------------------------

    async def get_settings(self, provider_id: str) -> dict[str, Any]:
        """The provider's travel policy (404 until configured for the first time)."""
        row = await self._areas.get_settings(provider_id)
        if row is None:
            raise NotFoundError("Travel policy not configured yet")
        return self._json_safe(dict(row))

    async def list_areas(self, provider_id: str) -> list[dict[str, Any]]:
        rows = await self._areas.list_areas(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def list_exclusions(self, provider_id: str) -> list[dict[str, Any]]:
        rows = await self._areas.list_exclusions(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    # -- commands: travel policy ---------------------------------------------

    async def save_settings(self, provider_id: str, data: dict[str, Any]) -> dict[str, Any]:
        """Create or replace the travel/area policy."""
        if data.get("max_travel_km") is not None:
            self._positive("max_travel_km", data["max_travel_km"])
        for name in ("travel_fee", "free_travel_radius_km"):
            if data.get(name) is not None:
                self._non_negative(name, data[name])
        self._validate_point(
            data.get("base_latitude"), data.get("base_longitude"), "base_location"
        )

        row = await self._areas.upsert_settings(provider_id, data)
        result = self._json_safe(dict(row)) if row is not None else {}
        await self._emit(
            provider_id,
            "provider.areas.settings_updated",
            {"has_travel_policy": data.get("max_travel_km") is not None},
        )
        return result

    # -- commands: area entries -----------------------------------------------

    async def add_area(self, provider_id: str, data: dict[str, Any]) -> dict[str, Any]:
        """Add one service-area entry (LOCATION or RADIUS)."""
        self._validate_area_payload(data, partial=False)
        payload = dict(data)
        if not payload.get("label"):
            payload["label"] = self._default_area_label(payload)

        row = await self._areas.add_area(provider_id, payload)
        if row is None:
            raise ValidationError("Area could not be created")
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.areas.area_added",
            {"area_id": result.get("area_id"), "area_type": payload.get("area_type")},
        )
        return result

    async def update_area(
        self, provider_id: str, area_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Partial edit of one owned area entry (area_type is immutable)."""
        self._validate_area_id(area_id)
        self._validate_area_payload(data, partial=True)
        row = await self._areas.update_area(provider_id, area_id, data)
        if row is None:
            raise NotFoundError("Service area not found")
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.areas.area_updated",
            {"area_id": area_id},
        )
        return result

    async def remove_area(self, provider_id: str, area_id: str) -> dict[str, Any]:
        """Delete one owned area entry."""
        self._validate_area_id(area_id)
        row = await self._areas.remove_area(provider_id, area_id)
        if row is None:
            raise NotFoundError("Service area not found")
        removed = self._json_safe(dict(row))
        await self._emit(provider_id, "provider.areas.area_removed", {"area_id": area_id})
        return removed

    # -- commands: exclusions ---------------------------------------------------

    async def add_exclusion(
        self, provider_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Declare an area the provider does not serve."""
        if not data.get("label") and not any(
            data.get(field) for field in _LOCATION_FIELDS
        ):
            raise ValidationError(
                "An exclusion needs a label or at least one location part"
            )
        row = await self._areas.add_exclusion(provider_id, data)
        if row is None:
            raise ValidationError("Exclusion could not be created")
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.areas.exclusion_added",
            {"exclusion_id": result.get("exclusion_id")},
        )
        return result

    async def remove_exclusion(
        self, provider_id: str, exclusion_id: str
    ) -> dict[str, Any]:
        """Delete one owned exclusion."""
        self._validate_area_id(exclusion_id, what="Exclusion")
        row = await self._areas.remove_exclusion(provider_id, exclusion_id)
        if row is None:
            raise NotFoundError("Exclusion not found")
        removed = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.areas.exclusion_removed",
            {"exclusion_id": exclusion_id},
        )
        return removed

    # -- helpers -----------------------------------------------------------------

    def _validate_area_payload(self, data: dict[str, Any], *, partial: bool) -> None:
        """Shared guard for add/update; area_type itself is immutable after add."""
        area_type = data.get("area_type")
        if not partial:
            if area_type not in _AREA_TYPES:
                raise ValidationError(
                    "area_type must be one of: " + ", ".join(_AREA_TYPES)
                )
        radius = data.get("radius_km")
        if radius is not None:
            self._positive("radius_km", radius)
        if data.get("center_latitude") is not None or data.get("center_longitude") is not None:
            self._validate_point(
                data.get("center_latitude"),
                data.get("center_longitude"),
                "area centre",
            )
        if not partial and area_type == "RADIUS":
            if data.get("center_latitude") is None or data.get("center_longitude") is None:
                raise ValidationError(
                    "RADIUS areas require center_latitude and center_longitude"
                )
            if radius is None:
                raise ValidationError("RADIUS areas require radius_km")
        if not partial and area_type == "LOCATION" and not any(
            data.get(field) for field in ("country", "region", "city")
        ):
            raise ValidationError(
                "LOCATION areas require at least one of country, region or city"
            )

    @staticmethod
    def _default_area_label(data: dict[str, Any]) -> str:
        """Friendly label when the client does not send one."""
        if data.get("area_type") == "RADIUS":
            return f"Within {data.get('radius_km')} km"
        parts = [
            str(data.get(field))
            for field in ("neighborhood", "ward", "district", "city", "region")
            if data.get(field)
        ]
        return ", ".join(parts[:3]) if parts else "Service area"

    @staticmethod
    def _validate_area_id(area_id: str, what: str = "Service area") -> None:
        """Malformed ids are a client 404, never a database DataError (Phase 5 lesson)."""
        try:
            UUID(str(area_id))
        except (ValueError, AttributeError, TypeError) as exc:
            raise NotFoundError(f"{what} not found") from exc

    def _validate_point(self, latitude: Any, longitude: Any, what: str) -> None:
        if latitude is None and longitude is None:
            return
        try:
            lat = Decimal(str(latitude)) if latitude is not None else None
            lng = Decimal(str(longitude)) if longitude is not None else None
        except (InvalidOperation, ValueError) as exc:
            raise ValidationError(f"{what} must be valid coordinates") from exc
        if lat is not None and not (-90 <= lat <= 90):
            raise ValidationError(f"{what}: latitude must be between -90 and 90")
        if lng is not None and not (-180 <= lng <= 180):
            raise ValidationError(f"{what}: longitude must be between -180 and 180")

    @staticmethod
    def _positive(name: str, value: Any) -> Decimal:
        try:
            amount = Decimal(str(value))
        except (InvalidOperation, ValueError) as exc:
            raise ValidationError(f"{name} must be a valid amount") from exc
        if amount <= 0:
            raise ValidationError(f"{name} must be greater than zero")
        return amount

    @staticmethod
    def _non_negative(name: str, value: Any) -> Decimal:
        try:
            amount = Decimal(str(value))
        except (InvalidOperation, ValueError) as exc:
            raise ValidationError(f"{name} must be a valid amount") from exc
        if amount < 0:
            raise ValidationError(f"{name} must be zero or greater")
        return amount

    def _json_safe(self, row: dict[str, Any]) -> dict[str, Any]:
        for key, value in row.items():
            if isinstance(value, (datetime, date)):
                row[key] = value.isoformat()
            elif isinstance(value, Decimal):
                row[key] = float(value)
            elif isinstance(value, UUID):
                row[key] = str(value)
        return row

    async def _emit(self, provider_id: str, event_type: str, payload: dict[str, Any]) -> None:
        if self._events is None:
            return
        try:
            from app.events.event import make_event

            await self._events.publish(
                make_event(event_type, {"provider_id": provider_id, **payload})
            )
        except Exception:  # noqa: BLE001 — side effects must never break the command
            pass