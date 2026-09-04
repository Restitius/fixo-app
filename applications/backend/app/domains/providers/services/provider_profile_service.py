"""ProviderProfileService — curate the public profile (Provider Requirement Phase 3).

Owns the personal + professional profile fields, validation/normalisation and
the public-view projection (what customers will eventually see). Storage goes
through ProviderProfileRepository; events through the EventManager port.
"""
from __future__ import annotations

import json
from datetime import date
from typing import Any

_GENDERS = {"MALE", "FEMALE", "OTHER", "UNDISCLOSED"}
_LIST_FIELDS = ("qualifications", "certifications", "skills", "specializations", "tools")
_MAX_LIST_ITEMS = 30
_MAX_ITEM_LEN = 120

_UPDATABLE_TEXT = (
    "profile_photo_url",
    "bio",
    "languages",
    "professional_title",
)


class ProviderProfileService:
    def __init__(self, profiles: Any, events: Any = None) -> None:
        self._profiles = profiles
        self._events = events

    # -- queries -------------------------------------------------------------

    async def get_profile(self, provider_id: str) -> dict[str, Any]:
        row = await self._profiles.get(provider_id)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Provider profile not found")
        return self._with_parsed_lists(dict(row))

    async def public_preview(self, provider_id: str) -> dict[str, Any]:
        """Exactly the projection customers will see (Requirement: preview)."""
        row = await self._profiles.public_view(provider_id)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Provider profile not found")
        return self._with_parsed_lists(dict(row))

    # -- commands ------------------------------------------------------------

    async def update_profile(self, provider_id: str, data: dict[str, Any]) -> dict[str, Any]:
        fields = self._normalise(data)
        row = await self._profiles.update(provider_id, fields)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Provider profile not found")
        await self._emit(provider_id, "provider.profile.updated", {"fields": sorted(fields)})
        return self._with_parsed_lists(dict(row))

    # -- validation / normalisation -------------------------------------------

    def _normalise(self, data: dict[str, Any]) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import ValidationError

        fields: dict[str, Any] = {}

        for name in _UPDATABLE_TEXT:
            if name in data and data[name] is not None:
                value = str(data[name]).strip()
                limit = 500 if name == "profile_photo_url" else (
                    1000 if name == "bio" else 200
                )
                if len(value) > limit:
                    raise ValidationError(f"{name} exceeds {limit} characters")
                fields[name] = value or None

        if "gender" in data and data["gender"] is not None:
            gender = str(data["gender"]).strip().upper()
            if gender not in _GENDERS:
                raise ValidationError(f"gender must be one of {sorted(_GENDERS)}")
            fields["gender"] = gender

        if "date_of_birth" in data and data["date_of_birth"] is not None:
            raw = data["date_of_birth"]
            try:
                dob = raw if isinstance(raw, date) else date.fromisoformat(str(raw))
            except ValueError as exc:
                raise ValidationError(
                    "date_of_birth must be an ISO date (YYYY-MM-DD)"
                ) from exc
            if dob >= date.today():
                raise ValidationError("date_of_birth must be in the past")
            fields["date_of_birth"] = dob  # native date — asyncpg binds it directly

        if "years_experience" in data and data["years_experience"] is not None:
            try:
                years = int(data["years_experience"])
            except (TypeError, ValueError) as exc:
                raise ValidationError("years_experience must be a whole number") from exc
            if not 0 <= years <= 60:
                raise ValidationError("years_experience must be between 0 and 60")
            fields["years_experience"] = years

        for name in _LIST_FIELDS:
            if name in data and data[name] is not None:
                fields[name] = self._normalise_list(name, data[name])

        return fields

    def _normalise_list(self, name: str, value: Any) -> str:
        from app.shared.exceptions.hierarchy import ValidationError

        if isinstance(value, str):
            items = [part.strip() for part in value.split(",")]
        elif isinstance(value, list):
            items = [str(part).strip() for part in value]
        else:
            raise ValidationError(f"{name} must be a list of strings")

        items = [item for item in items if item]
        for item in items:
            if len(item) > _MAX_ITEM_LEN:
                raise ValidationError(
                    f"{name} items must be at most {_MAX_ITEM_LEN} characters"
                )
        if len(items) > _MAX_LIST_ITEMS:
            raise ValidationError(f"{name} accepts at most {_MAX_LIST_ITEMS} items")
        seen: set[str] = set()
        unique: list[str] = []
        for item in items:
            key = item.lower()
            if key not in seen:
                seen.add(key)
                unique.append(item)
        return json.dumps(unique)

    # -- helpers --------------------------------------------------------------

    def _with_parsed_lists(self, profile: dict[str, Any]) -> dict[str, Any]:
        from datetime import datetime
        from decimal import Decimal

        for name in _LIST_FIELDS:
            raw = profile.get(name)
            if isinstance(raw, str):
                try:
                    profile[name] = json.loads(raw)
                except json.JSONDecodeError:
                    profile[name] = []
            elif raw is None:
                profile[name] = []

        # JSON-safe scalars: dates/datetimes → ISO strings, numerics → float.
        for key, value in profile.items():
            if isinstance(value, datetime):
                profile[key] = value.isoformat()
            elif isinstance(value, date):
                profile[key] = value.isoformat()
            elif isinstance(value, Decimal):
                profile[key] = float(value)
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

