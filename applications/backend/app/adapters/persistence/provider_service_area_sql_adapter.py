"""ProviderServiceAreaSqlAdapter — implements ProviderServiceAreaRepository.

This is the ONLY place PRV.AREAS.* query IDs appear.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy.exc import IntegrityError

from app.platform.query.sql_query_manager import SQLQueryManager
from app.shared.exceptions.hierarchy import ConflictError, ValidationError


class ProviderServiceAreaQueryIds:
    SETTINGS_GET = "PRV.AREAS.SETTINGS.GET"
    SETTINGS_UPSERT = "PRV.AREAS.SETTINGS.UPSERT"
    LIST = "PRV.AREAS.LIST"
    ADD = "PRV.AREAS.ADD"
    UPDATE = "PRV.AREAS.UPDATE"
    REMOVE = "PRV.AREAS.REMOVE"
    EXCLUSIONS_LIST = "PRV.AREAS.EXCLUSIONS.LIST"
    EXCLUSIONS_ADD = "PRV.AREAS.EXCLUSIONS.ADD"
    EXCLUSIONS_REMOVE = "PRV.AREAS.EXCLUSIONS.REMOVE"


def _as_decimal(value: Any) -> Decimal | None:
    """asyncpg binds native Decimal for NUMERIC columns (Phase 3 lesson)."""
    if value is None or isinstance(value, Decimal):
        return value
    if isinstance(value, bool):
        raise ValidationError("boolean is not a valid amount")
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    if isinstance(value, str) and value.strip():
        try:
            return Decimal(value.strip())
        except InvalidOperation as exc:
            raise ValidationError(f"'{value}' is not a valid amount") from exc
    return None


def _decimal_params(data: dict[str, Any], *fields: str) -> dict[str, Any]:
    return {field: _as_decimal(data.get(field)) for field in fields}


_LOCATION_FIELDS = ("country", "region", "city", "district", "ward", "neighborhood")


class ProviderServiceAreaSqlAdapter:
    """Implements ProviderServiceAreaRepository.

    SQLAlchemy ``text()`` requires every named bind to be present — the full
    parameter set is always supplied (Phase 3 lesson). CHECK-constraint
    violations surface as IntegrityError and are translated to ConflictError
    here as a defensive backstop; the service validates earlier with
    friendlier messages.
    """

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def get_settings(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderServiceAreaQueryIds.SETTINGS_GET,
            {"user_id": provider_id},
            fetch="one",
        )

    async def upsert_settings(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            **_decimal_params(
                data, "base_latitude", "base_longitude",
                "max_travel_km", "travel_fee", "free_travel_radius_km",
            ),
            "currency": data.get("currency") or "TZS",
            "notes": data.get("notes"),
        }
        try:
            return await self._sql.execute(
                ProviderServiceAreaQueryIds.SETTINGS_UPSERT, params, fetch="one"
            )
        except IntegrityError as exc:
            raise ConflictError(
                "Travel policy rejected — distances must be positive and the "
                "fee non-negative"
            ) from exc

    async def list_areas(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderServiceAreaQueryIds.LIST, {"user_id": provider_id}
        ) or []

    async def add_area(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "area_type": data.get("area_type"),
            "label": data.get("label"),
            **{field: data.get(field) for field in _LOCATION_FIELDS},
            **_decimal_params(
                data, "center_latitude", "center_longitude", "radius_km"
            ),
            "is_active": bool(data.get("is_active", True)),
        }
        try:
            return await self._sql.execute(
                ProviderServiceAreaQueryIds.ADD, params, fetch="one"
            )
        except IntegrityError as exc:
            raise ConflictError(
                "Area rejected — RADIUS entries need a centre and a positive "
                "radius; LOCATION entries need at least one of country, "
                "region or city"
            ) from exc

    async def update_area(
        self, provider_id: str, area_id: str, data: dict[str, Any]
    ) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "area_id": area_id,
            "label": data.get("label"),
            **{field: data.get(field) for field in _LOCATION_FIELDS},
            **_decimal_params(
                data, "center_latitude", "center_longitude", "radius_km"
            ),
            "is_active": (
                bool(data["is_active"]) if "is_active" in data else None
            ),
        }
        try:
            return await self._sql.execute(
                ProviderServiceAreaQueryIds.UPDATE, params, fetch="one"
            )
        except IntegrityError as exc:
            raise ConflictError("Area update rejected by data constraints") from exc

    async def remove_area(self, provider_id: str, area_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderServiceAreaQueryIds.REMOVE,
            {"user_id": provider_id, "area_id": area_id},
            fetch="one",
        )

    async def list_exclusions(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderServiceAreaQueryIds.EXCLUSIONS_LIST, {"user_id": provider_id}
        ) or []

    async def add_exclusion(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "label": data.get("label"),
            **{field: data.get(field) for field in _LOCATION_FIELDS},
        }
        try:
            return await self._sql.execute(
                ProviderServiceAreaQueryIds.EXCLUSIONS_ADD, params, fetch="one"
            )
        except IntegrityError as exc:
            raise ConflictError(
                "Exclusion rejected — provide a label or at least one "
                "location part"
            ) from exc

    async def remove_exclusion(
        self, provider_id: str, exclusion_id: str
    ) -> Any | None:
        return await self._sql.execute(
            ProviderServiceAreaQueryIds.EXCLUSIONS_REMOVE,
            {"user_id": provider_id, "exclusion_id": exclusion_id},
            fetch="one",
        )