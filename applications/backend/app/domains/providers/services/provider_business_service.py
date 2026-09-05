"""ProviderBusinessService — company business profile (Provider Requirement Phase 4).

One 1:1 company record per provider account: identity (name / logo /
registration / tax), contact, location, description, year established,
headcount, website and social profiles. Storage goes through
ProviderBusinessRepository; events through the EventManager port.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

_TEXT_LIMITS = {
    "business_name": 160,
    "logo_url": 500,
    "registration_number": 80,
    "tax_number": 80,
    "business_email": 180,
    "business_phone": 20,
    "address": 300,
    "city": 80,
    "region": 80,
    "country": 80,
    "description": 2000,
    "website": 300,
}

_SOCIAL_MAX_ENTRIES = 8
_SOCIAL_KEY_MAX = 40
_SOCIAL_VALUE_MAX = 300


class ProviderBusinessService:
    def __init__(self, business: Any, events: Any = None) -> None:
        self._business = business
        self._events = events

    # -- queries -------------------------------------------------------------

    async def get(self, provider_id: str) -> dict[str, Any]:
        row = await self._business.get(provider_id)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Business profile not found")
        return self._json_safe(dict(row))

    # -- commands ------------------------------------------------------------

    async def upsert(self, provider_id: str, data: dict[str, Any]) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import ValidationError

        fields = self._normalise(data)

        creating = await self._business.get(provider_id) is None
        if creating and not fields.get("business_name"):
            raise ValidationError(
                "business_name is required to create a business profile"
            )

        row = await self._business.upsert(provider_id, fields)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Business profile not found")
        await self._emit(
            provider_id,
            "provider.business.updated",
            {"fields": sorted(k for k in fields if k != "social")},
        )
        return self._json_safe(dict(row))

    async def delete(self, provider_id: str) -> dict[str, Any]:
        row = await self._business.delete(provider_id)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Business profile not found")
        await self._emit(provider_id, "provider.business.removed", {})
        return {"business_id": str(row["business_id"])}

    # -- validation / normalisation -------------------------------------------

    def _normalise(self, data: dict[str, Any]) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import ValidationError

        fields: dict[str, Any] = {}

        for name, limit in _TEXT_LIMITS.items():
            if name in data and data[name] is not None:
                value = str(data[name]).strip()
                if len(value) > limit:
                    raise ValidationError(f"{name} exceeds {limit} characters")
                if name == "business_name" and not value:
                    raise ValidationError("business_name cannot be empty")
                fields[name] = value or None

        if "year_established" in data and data["year_established"] is not None:
            try:
                year = int(data["year_established"])
            except (TypeError, ValueError) as exc:
                raise ValidationError(
                    "year_established must be a whole number"
                ) from exc
            if not 1800 <= year <= date.today().year:
                raise ValidationError(
                    f"year_established must be between 1800 and {date.today().year}"
                )
            fields["year_established"] = year

        if "num_employees" in data and data["num_employees"] is not None:
            try:
                employees = int(data["num_employees"])
            except (TypeError, ValueError) as exc:
                raise ValidationError(
                    "num_employees must be a whole number"
                ) from exc
            if not 0 <= employees <= 1_000_000:
                raise ValidationError(
                    "num_employees must be between 0 and 1000000"
                )
            fields["num_employees"] = employees

        if "social" in data:
            fields["social"] = self._normalise_social(data["social"])

        return fields

    def _normalise_social(self, value: Any) -> dict[str, str] | None:
        from app.shared.exceptions.hierarchy import ValidationError

        if value is None:
            return None
        if not isinstance(value, dict):
            raise ValidationError("social must be an object of platform -> url")
        social: dict[str, str] = {}
        for key, url in value.items():
            k = str(key).strip().lower()[:_SOCIAL_KEY_MAX]
            v = str(url).strip()
            if not k or not v:
                continue
            if len(v) > _SOCIAL_VALUE_MAX:
                raise ValidationError(
                    f"social.{k} exceeds {_SOCIAL_VALUE_MAX} characters"
                )
            social[k] = v
        if len(social) > _SOCIAL_MAX_ENTRIES:
            raise ValidationError(
                f"social accepts at most {_SOCIAL_MAX_ENTRIES} platforms"
            )
        return social

    # -- helpers --------------------------------------------------------------

    def _json_safe(self, profile: dict[str, Any]) -> dict[str, Any]:
        for key, value in profile.items():
            if isinstance(value, datetime):
                profile[key] = value.isoformat()
            elif isinstance(value, date):
                profile[key] = value.isoformat()
            elif isinstance(value, Decimal):
                profile[key] = float(value)
            elif isinstance(value, uuid.UUID):
                profile[key] = str(value)
        return profile

    async def _emit(self, provider_id: str, event_type: str, payload: dict[str, Any]) -> None:
        if self._events is None:
            return
        try:
            await self._events.emit(
                event_type,
                {"provider_id": provider_id, **payload},
                aggregate_type="PROVIDER",
                aggregate_id=provider_id,
            )
        except Exception:  # noqa: BLE001 — side effects must never break the command
            pass
