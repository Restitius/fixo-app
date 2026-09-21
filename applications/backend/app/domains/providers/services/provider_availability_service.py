"""ProviderAvailabilityService — working hours & availability (Provider Req Phase 9).

Owns the schedule rules: the weekly recurring windows (one per day,
0=Monday .. 6=Sunday, an unavailable day has no window), the availability
toggles (ONLINE/OFFLINE, emergency, same-day, holiday, vacation mode) and
temporary unavailable periods. Persistence goes through
ProviderAvailabilityRepository; ``summary`` is the effective snapshot the
dashboard (Phase 10) and the matching engine (Phase 12) will consume.
"""
from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal
from typing import Any
from uuid import UUID

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

_DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")


class ProviderAvailabilityService:
    """Owns availability toggles, the weekly schedule and time-off periods."""

    def __init__(self, availability: Any, events: Any = None) -> None:
        self._availability = availability
        self._events = events

    # -- queries ---------------------------------------------------------------

    async def get_settings(self, provider_id: str) -> dict[str, Any]:
        """The provider's availability settings (404 until configured)."""
        row = await self._availability.get_settings(provider_id)
        if row is None:
            raise NotFoundError("Availability settings not configured yet")
        return self._json_safe(dict(row))

    async def list_hours(self, provider_id: str) -> list[dict[str, Any]]:
        """The weekly recurring schedule (may be empty = nothing set)."""
        rows = await self._availability.list_hours(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def list_time_off(self, provider_id: str) -> list[dict[str, Any]]:
        """Temporary unavailable periods."""
        rows = await self._availability.list_time_off(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def summary(self, provider_id: str) -> dict[str, Any]:
        """Effective availability snapshot; an unconfigured provider is offline."""
        row = await self._availability.summary(provider_id)
        if row is None:
            return {
                "is_online": False,
                "accepts_emergency": False,
                "accepts_same_day": False,
                "accepts_holidays": False,
                "vacation_mode": False,
                "vacation_from": None,
                "vacation_until": None,
                "timezone": "UTC",
                "available_days": 0,
                "currently_on_time_off": False,
            }
        return self._json_safe(dict(row))

    # -- commands: settings -------------------------------------------------------

    async def save_settings(self, provider_id: str, data: dict[str, Any]) -> dict[str, Any]:
        """Create or replace the availability toggles + vacation window."""
        vacation_from = self._parse_date(data.get("vacation_from"), "vacation_from")
        vacation_until = self._parse_date(data.get("vacation_until"), "vacation_until")
        if (vacation_from is None) != (vacation_until is None):
            raise ValidationError(
                "vacation_from and vacation_until must be provided together"
            )
        if (
            vacation_from is not None
            and vacation_until is not None
            and vacation_from > vacation_until
        ):
            raise ValidationError("vacation_from must be on or before vacation_until")
        payload = dict(data)
        payload["vacation_from"] = vacation_from
        payload["vacation_until"] = vacation_until

        row = await self._availability.upsert_settings(provider_id, payload)
        result = self._json_safe(dict(row)) if row is not None else {}
        await self._emit(
            provider_id,
            "provider.availability.settings_updated",
            {"is_online": bool(data.get("is_online", False))},
        )
        return result

    # -- commands: weekly schedule ---------------------------------------------

    async def set_day(
        self, provider_id: str, day_of_week: int, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Upsert one day's recurring window (e.g. Monday 08:00-18:00)."""
        day = self._validate_day(day_of_week)
        is_available = bool(data.get("is_available", True))
        start = self._parse_time(data.get("start_time"), "start_time")
        end = self._parse_time(data.get("end_time"), "end_time")
        if is_available:
            if start is None or end is None:
                raise ValidationError(
                    "An available day requires start_time and end_time"
                )
            if start >= end:
                raise ValidationError("start_time must be before end_time")
        else:
            start = None
            end = None

        row = await self._availability.set_day(
            provider_id,
            day,
            {"is_available": is_available, "start_time": start, "end_time": end},
        )
        result = self._json_safe(dict(row)) if row is not None else {}
        await self._emit(
            provider_id,
            "provider.availability.hours_updated",
            {"day_of_week": day, "is_available": is_available},
        )
        return result

    async def clear_day(self, provider_id: str, day_of_week: int) -> dict[str, Any]:
        """Reset one day (no row = unset/unavailable)."""
        day = self._validate_day(day_of_week)
        row = await self._availability.clear_day(provider_id, day)
        if row is None:
            raise NotFoundError(
                f"No working hours set for {_DAYS[day]}"
            )
        await self._emit(
            provider_id,
            "provider.availability.hours_cleared",
            {"day_of_week": day},
        )
        return self._json_safe(dict(row))

    # -- commands: time off -------------------------------------------------------

    async def add_time_off(self, provider_id: str, data: dict[str, Any]) -> dict[str, Any]:
        """Declare a temporary unavailable period."""
        starts = self._parse_datetime(data.get("starts_at"), "starts_at")
        ends = self._parse_datetime(data.get("ends_at"), "ends_at")
        if starts is None or ends is None:
            raise ValidationError("An unavailable period requires starts_at and ends_at")
        if ends <= starts:
            raise ValidationError("ends_at must be after starts_at")

        row = await self._availability.add_time_off(
            provider_id,
            {"reason": data.get("reason"), "starts_at": starts, "ends_at": ends},
        )
        result = self._json_safe(dict(row)) if row is not None else {}
        await self._emit(
            provider_id,
            "provider.availability.time_off_added",
            {"time_off_id": result.get("time_off_id")},
        )
        return result

    async def remove_time_off(
        self, provider_id: str, time_off_id: str
    ) -> dict[str, Any]:
        """Delete one owned unavailable period."""
        self._validate_uuid(time_off_id, "Unavailable period")
        row = await self._availability.remove_time_off(provider_id, time_off_id)
        if row is None:
            raise NotFoundError("Unavailable period not found")
        removed = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.availability.time_off_removed",
            {"time_off_id": time_off_id},
        )
        return removed

    # -- helpers -----------------------------------------------------------------

    @staticmethod
    def _validate_day(day_of_week: Any) -> int:
        try:
            day = int(day_of_week)
        except (TypeError, ValueError) as exc:
            raise ValidationError("day_of_week must be an integer 0-6") from exc
        if not 0 <= day <= 6:
            raise ValidationError("day_of_week must be 0-6 (0=Monday .. 6=Sunday)")
        return day

    @staticmethod
    def _parse_time(value: Any, name: str) -> time | None:
        if value is None or value == "":
            return None
        try:
            return time.fromisoformat(str(value))
        except ValueError as exc:
            raise ValidationError(f"{name} must be an ISO time like '08:00'") from exc

    @staticmethod
    def _parse_date(value: Any, name: str) -> date | None:
        if value is None or value == "":
            return None
        try:
            return date.fromisoformat(str(value))
        except ValueError as exc:
            raise ValidationError(f"{name} must be an ISO date like '2026-01-31'") from exc

    @staticmethod
    def _parse_datetime(value: Any, name: str) -> datetime | None:
        if value is None or value == "":
            return None
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValidationError(
                f"{name} must be an ISO datetime like '2026-01-31T08:00:00'"
            ) from exc

    @staticmethod
    def _validate_uuid(value: str, what: str) -> None:
        """Malformed ids are a client 404, never a database DataError (Phase 5 lesson)."""
        try:
            UUID(str(value))
        except (ValueError, AttributeError, TypeError) as exc:
            raise NotFoundError(f"{what} not found") from exc

    def _json_safe(self, row: dict[str, Any]) -> dict[str, Any]:
        for key, value in row.items():
            if isinstance(value, (datetime, date, time)):
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