"""ProviderAvailabilitySqlAdapter — implements ProviderAvailabilityRepository.

This is the ONLY place PRV.AVAIL.* query IDs appear.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.exc import IntegrityError

from app.platform.query.sql_query_manager import SQLQueryManager
from app.shared.exceptions.hierarchy import ConflictError, ValidationError


class ProviderAvailabilityQueryIds:
    SETTINGS_GET = "PRV.AVAIL.SETTINGS.GET"
    SETTINGS_UPSERT = "PRV.AVAIL.SETTINGS.UPSERT"
    HOURS_LIST = "PRV.AVAIL.HOURS.LIST"
    HOURS_SET = "PRV.AVAIL.HOURS.SET"
    HOURS_DELETE = "PRV.AVAIL.HOURS.DELETE"
    TIMEOFF_LIST = "PRV.AVAIL.TIMEOFF.LIST"
    TIMEOFF_ADD = "PRV.AVAIL.TIMEOFF.ADD"
    TIMEOFF_REMOVE = "PRV.AVAIL.TIMEOFF.REMOVE"
    SUMMARY = "PRV.AVAIL.SUMMARY"


class ProviderAvailabilitySqlAdapter:
    """Implements ProviderAvailabilityRepository.

    SQLAlchemy ``text()`` requires every named bind to be present — the full
    parameter set is always supplied (Phase 3 lesson). Temporal values are
    bound as native ``time``/``date``/``datetime`` objects (asyncpg rejects
    ISO strings for those columns). CHECK-constraint violations surface as
    IntegrityError and are translated to ConflictError here as a defensive
    backstop; the service validates earlier with friendlier messages.
    """

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def get_settings(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderAvailabilityQueryIds.SETTINGS_GET,
            {"user_id": provider_id},
            fetch="one",
        )

    async def upsert_settings(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "is_online": bool(data.get("is_online", False)),
            "accepts_emergency": bool(data.get("accepts_emergency", False)),
            "accepts_same_day": bool(data.get("accepts_same_day", False)),
            "accepts_holidays": bool(data.get("accepts_holidays", False)),
            "vacation_mode": bool(data.get("vacation_mode", False)),
            "vacation_from": data.get("vacation_from"),
            "vacation_until": data.get("vacation_until"),
            "timezone": data.get("timezone") or "UTC",
            "notes": data.get("notes"),
        }
        try:
            return await self._sql.execute(
                ProviderAvailabilityQueryIds.SETTINGS_UPSERT, params, fetch="one"
            )
        except IntegrityError as exc:
            raise ConflictError(
                "Availability settings rejected by data constraints"
            ) from exc

    async def list_hours(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderAvailabilityQueryIds.HOURS_LIST, {"user_id": provider_id}
        ) or []

    async def set_day(
        self, provider_id: str, day_of_week: int, data: dict[str, Any]
    ) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "day_of_week": int(day_of_week),
            "is_available": bool(data.get("is_available", True)),
            "start_time": data.get("start_time"),
            "end_time": data.get("end_time"),
        }
        try:
            return await self._sql.execute(
                ProviderAvailabilityQueryIds.HOURS_SET, params, fetch="one"
            )
        except IntegrityError as exc:
            raise ConflictError(
                "Working hours rejected — the window must satisfy "
                "start_time < end_time and day_of_week must be 0-6"
            ) from exc

    async def clear_day(self, provider_id: str, day_of_week: int) -> Any | None:
        return await self._sql.execute(
            ProviderAvailabilityQueryIds.HOURS_DELETE,
            {"user_id": provider_id, "day_of_week": int(day_of_week)},
            fetch="one",
        )

    async def list_time_off(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderAvailabilityQueryIds.TIMEOFF_LIST, {"user_id": provider_id}
        ) or []

    async def add_time_off(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "reason": data.get("reason"),
            "starts_at": data.get("starts_at"),
            "ends_at": data.get("ends_at"),
        }
        try:
            return await self._sql.execute(
                ProviderAvailabilityQueryIds.TIMEOFF_ADD, params, fetch="one"
            )
        except IntegrityError as exc:
            raise ConflictError(
                "Unavailable period rejected — ends_at must be after starts_at"
            ) from exc

    async def remove_time_off(self, provider_id: str, time_off_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderAvailabilityQueryIds.TIMEOFF_REMOVE,
            {"user_id": provider_id, "time_off_id": time_off_id},
            fetch="one",
        )

    async def summary(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderAvailabilityQueryIds.SUMMARY,
            {"user_id": provider_id},
            fetch="one",
        )