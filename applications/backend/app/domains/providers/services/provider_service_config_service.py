"""ProviderServiceConfigService — per-service configuration + approval gate (Provider Req Phase 6).

Provider side: browse the active catalogue, fully configure one service at a
time (identity overrides, experience, pricing model, minimum charge, duration,
emergency availability, tools, materials, warranty, photos), archive it, and
submit it for platform approval. Any edit resets the lifecycle to DRAFT.
Platform side (consumed later by the admin module behind an admin guard):
APPROVED/REJECTED decisions on PENDING_APPROVAL configurations — only approved
services may receive requests.
Storage goes through ProviderServiceConfigRepository; events through the
EventManager port.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

_PRICING_MODELS = ("FIXED", "HOURLY", "QUOTED")
_REVIEW_DECISIONS = ("APPROVED", "REJECTED")


class ProviderServiceConfigService:
    def __init__(self, services: Any, events: Any = None) -> None:
        self._services = services
        self._events = events

    # -- provider queries ------------------------------------------------------

    async def catalog(self) -> list[dict[str, Any]]:
        return [self._json_safe(dict(row)) for row in await self._services.catalog()]

    async def configs(self, provider_id: str) -> list[dict[str, Any]]:
        rows = await self._services.list_configs(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def config(self, provider_id: str, service_id: str) -> dict[str, Any]:
        row = await self._services.get_config(provider_id, self._service_id(service_id))
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Service configuration not found")
        return self._json_safe(dict(row))

    # -- provider commands -----------------------------------------------------

    async def upsert(
        self, provider_id: str, service_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import ValidationError

        sid = self._service_id(service_id)
        catalogue = {str(row["service_id"]) for row in await self._services.catalog()}
        if sid not in catalogue:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError(f"Unknown or inactive catalogue service '{service_id}'")

        pricing_model = str(data.get("pricing_model") or "QUOTED").strip().upper()
        if pricing_model not in _PRICING_MODELS:
            raise ValidationError(
                "pricing_model must be one of: " + ", ".join(_PRICING_MODELS)
            )

        minimum_charge = data.get("minimum_charge")
        if pricing_model == "FIXED":
            if minimum_charge is None:
                raise ValidationError("minimum_charge is required for FIXED pricing")
            if float(minimum_charge) <= 0:
                raise ValidationError("minimum_charge must be greater than zero")

        years = data.get("years_experience")
        if years is not None and not 0 <= int(years) <= 60:
            raise ValidationError("years_experience must be between 0 and 60")

        duration = data.get("duration_minutes")
        if duration is not None and not 0 < int(duration) <= 1440:
            raise ValidationError("duration_minutes must be between 1 and 1440")

        tools = self._as_string_list(data.get("tools"), "tools")
        materials = self._as_string_list(data.get("materials"), "materials")
        photos = self._as_string_list(data.get("photos"), "photos")
        warranty = data.get("warranty")
        if warranty is not None and not isinstance(warranty, dict):
            raise ValidationError("warranty must be an object")

        clean = dict(data)
        clean.update(
            pricing_model=pricing_model,
            minimum_charge=minimum_charge,
            years_experience=years,
            duration_minutes=duration,
            tools=tools,
            materials=materials,
            warranty=warranty,
            photos=photos,
        )

        row = await self._services.upsert_config(provider_id, sid, clean)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Service configuration not found")
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.service.configured",
            {
                "service_id": sid,
                "pricing_model": pricing_model,
                "status": result.get("status"),
            },
        )
        return result

    async def archive(self, provider_id: str, service_id: str) -> dict[str, Any]:
        sid = self._service_id(service_id)
        row = await self._services.archive_config(provider_id, sid)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Service configuration not found")
        result = self._json_safe(dict(row))
        await self._emit(provider_id, "provider.service.archived", {"service_id": sid})
        return result

    async def submit_for_approval(
        self, provider_id: str, service_id: str
    ) -> dict[str, Any]:
        sid = self._service_id(service_id)
        row = await self._services.submit_for_approval(provider_id, sid)
        if not row:
            from app.shared.exceptions.hierarchy import ValidationError

            raise ValidationError(
                "Only DRAFT or REJECTED configurations can be submitted for approval"
            )
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id, "provider.service.submitted", {"service_id": sid}
        )
        return result

    #  platform side (admin module later wires the guard) 

    async def review(
        self,
        provider_id: str,
        service_id: str,
        reviewer_id: str,
        decision: str,
        review_notes: str | None = None,
    ) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import ValidationError

        normalized = str(decision or "").strip().upper()
        if normalized not in _REVIEW_DECISIONS:
            raise ValidationError(
                "decision must be one of: " + ", ".join(_REVIEW_DECISIONS)
            )
        if review_notes is not None and not str(review_notes).strip():
            review_notes = None

        row = await self._services.review_config(
            self._uuid(provider_id, "provider_id"),
            self._service_id(service_id),
            self._uuid(reviewer_id, "reviewer_id"),
            normalized,
            review_notes,
        )
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError(
                "No PENDING_APPROVAL configuration found for this service"
            )
        result = self._json_safe(dict(row))
        await self._emit(
            str(result.get("provider_id") or provider_id),
            "provider.service.reviewed",
            {
                "service_id": str(result.get("service_id") or service_id),
                "decision": normalized,
            },
        )
        return result

    # -- helpers ----------------------------------------------------------------

    @staticmethod
    def _service_id(value: str) -> str:
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, AttributeError, TypeError) as exc:
            from app.shared.exceptions.hierarchy import ValidationError

            raise ValidationError("service_id must be a valid UUID") from exc

    @staticmethod
    def _uuid(value: str, field: str) -> str:
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, AttributeError, TypeError) as exc:
            from app.shared.exceptions.hierarchy import ValidationError

            raise ValidationError(f"{field} must be a valid UUID") from exc

    @staticmethod
    def _as_string_list(value: Any, field: str) -> list[str] | None:
        if value is None:
            return None
        if not isinstance(value, (list, tuple)):
            from app.shared.exceptions.hierarchy import ValidationError

            raise ValidationError(f"{field} must be a list of strings")
        items = [str(item).strip() for item in value if str(item).strip()]
        return items or None

    @staticmethod
    def _json_safe(row: dict[str, Any]) -> dict[str, Any]:
        safe: dict[str, Any] = {}
        for key, value in row.items():
            if isinstance(value, (datetime, date)):
                safe[key] = value.isoformat()
            elif isinstance(value, Decimal):
                safe[key] = float(value)
            elif isinstance(value, uuid.UUID):
                safe[key] = str(value)
            else:
                safe[key] = value
        return safe

    async def _emit(
        self, provider_id: str, event_type: str, payload: dict[str, Any]
    ) -> None:
        if self._events is None:
            return
        try:
            from app.events.event import make_event

            await self._events.publish(
                make_event(event_type, {"provider_id": provider_id, **payload})
            )
        except Exception:  # noqa: BLE001 — events must never fail the command
            import logging

            logging.getLogger(__name__).warning(
                "event emission failed for %s", event_type, exc_info=True
            )

