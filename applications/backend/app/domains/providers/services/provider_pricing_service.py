"""ProviderServicePricingService — five pricing structures per service (Provider Req Phase 7).

The pricing rules live here: FIXED (base_amount), STARTING (from_amount),
HOURLY (hourly_rate + optional minimum_hours), INSPECTION_THEN_QUOTE (optional
inspection_fee) and CUSTOM_QUOTATION (no amounts). Persistence goes through
ProviderServicePricingRepository; the composite FK to PROVIDER_SERVICES is the
database-level backstop, while the friendly "configure the service first"
error comes from the pre-check against ProviderServiceConfigRepository.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

_AMOUNT_FIELDS = ("base_amount", "from_amount", "hourly_rate", "minimum_hours", "inspection_fee")


class ProviderServicePricingService:
    """Owns the per-model pricing validation matrix for one structured row."""

    # model -> (required amounts, forbidden amounts); unlisted amounts are optional
    _RULES: dict[str, tuple[tuple[str, ...], tuple[str, ...]]] = {
        "FIXED": (
            ("base_amount",),
            ("from_amount", "hourly_rate", "minimum_hours", "inspection_fee"),
        ),
        "STARTING": (
            ("from_amount",),
            ("base_amount", "hourly_rate", "minimum_hours", "inspection_fee"),
        ),
        "HOURLY": (("hourly_rate",), ("base_amount", "from_amount", "inspection_fee")),
        "INSPECTION_THEN_QUOTE": (
            (),
            ("base_amount", "from_amount", "hourly_rate", "minimum_hours"),
        ),
        "CUSTOM_QUOTATION": ((), _AMOUNT_FIELDS),
    }

    def __init__(self, pricing: Any, services: Any, events: Any = None) -> None:
        self._pricing = pricing
        self._services = services
        self._events = events

    # -- queries -------------------------------------------------------------

    async def list_pricing(self, provider_id: str) -> list[dict[str, Any]]:
        rows = await self._pricing.list_pricing(provider_id)
        return [self._json_safe(row) for row in rows]

    async def get_pricing(self, provider_id: str, service_id: str) -> dict[str, Any]:
        self._validate_service_id(service_id)
        row = await self._pricing.get_pricing(provider_id, service_id)
        if row is None:
            raise NotFoundError("No pricing configured for this service")
        return self._json_safe(row)

    # -- commands -------------------------------------------------------------

    async def upsert_pricing(
        self, provider_id: str, service_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Full replace of one service's pricing under the five-model matrix."""
        self._validate_service_id(service_id)

        model = data.get("pricing_model")
        if not isinstance(model, str) or model not in self._RULES:
            allowed = ", ".join(sorted(self._RULES))
            raise ValidationError(f"pricing_model must be one of: {allowed}")

        required, forbidden = self._RULES[model]
        provided = {
            name: data.get(name) for name in _AMOUNT_FIELDS if data.get(name) is not None
        }
        missing = [name for name in required if name not in provided]
        if missing:
            raise ValidationError(f"{model} pricing requires: {', '.join(missing)}")
        rejected = [name for name in provided if name in forbidden]
        if rejected:
            raise ValidationError(f"{model} pricing does not accept: {', '.join(rejected)}")
        for name, value in provided.items():
            self._positive_amount(name, value)

        # Friendly 404 before the FK's 409: pricing requires a configured service.
        config = await self._services.get_config(provider_id, service_id)
        if config is None:
            raise NotFoundError("Configure this service before setting its pricing")

        row = await self._pricing.upsert_pricing(provider_id, service_id, data)
        result = self._json_safe(dict(row)) if row is not None else {}
        await self._emit(
            provider_id,
            "provider.service.pricing_updated",
            {"service_id": service_id, "pricing_model": model},
        )
        return result

    async def clear_pricing(self, provider_id: str, service_id: str) -> dict[str, Any]:
        """Remove one service's pricing; the parent configuration resets to quote-based."""
        self._validate_service_id(service_id)
        row = await self._pricing.clear_pricing(provider_id, service_id)
        if row is None:
            raise NotFoundError("No pricing configured for this service")
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.service.pricing_cleared",
            {"service_id": service_id},
        )
        return result

    # -- helpers --------------------------------------------------------------

    def _validate_service_id(self, service_id: str) -> None:
        """Malformed ids are a client 404, never a database DataError (Phase 5 lesson)."""
        try:
            UUID(str(service_id))
        except (ValueError, AttributeError, TypeError) as exc:
            raise NotFoundError("No pricing configured for this service") from exc

    def _positive_amount(self, name: str, value: Any) -> Decimal:
        try:
            amount = Decimal(str(value))
        except (InvalidOperation, ValueError) as exc:
            raise ValidationError(f"{name} must be a valid amount") from exc
        if amount <= 0:
            raise ValidationError(f"{name} must be greater than zero")
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
