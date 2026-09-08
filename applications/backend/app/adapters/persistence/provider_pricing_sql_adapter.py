"""ProviderServicePricingSqlAdapter — implements ProviderServicePricingRepository.

This is the ONLY place PRV.PRICING.* query IDs appear.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy.exc import IntegrityError

from app.platform.query.sql_query_manager import SQLQueryManager
from app.shared.exceptions.hierarchy import ConflictError, ValidationError


class ProviderServicePricingQueryIds:
    LIST = "PRV.PRICING.LIST"
    GET = "PRV.PRICING.GET"
    UPSERT = "PRV.PRICING.UPSERT"
    CLEAR = "PRV.PRICING.CLEAR"


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


class ProviderServicePricingSqlAdapter:
    """Implements ProviderServicePricingRepository.

    Amount columns are nullable, but SQLAlchemy ``text()`` requires every
    named bind to be present — the full parameter set is always supplied
    (Phase 3 lesson). The upsert/clear queries atomically re-sync the parent
    PROVIDER_SERVICES configuration; the composite FK enforces that only
    configured services can be priced (translated to ConflictError here as a
    defensive backstop — the service pre-checks with a friendlier 404).
    """

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def list_pricing(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderServicePricingQueryIds.LIST, {"user_id": provider_id}
        ) or []

    async def get_pricing(self, provider_id: str, service_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderServicePricingQueryIds.GET,
            {"user_id": provider_id, "service_id": service_id},
            fetch="one",
        )

    async def upsert_pricing(
        self, provider_id: str, service_id: str, data: dict[str, Any]
    ) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "service_id": service_id,
            "pricing_model": data.get("pricing_model"),
            "base_amount": _as_decimal(data.get("base_amount")),
            "from_amount": _as_decimal(data.get("from_amount")),
            "hourly_rate": _as_decimal(data.get("hourly_rate")),
            "minimum_hours": _as_decimal(data.get("minimum_hours")),
            "inspection_fee": _as_decimal(data.get("inspection_fee")),
            "currency": data.get("currency") or "TZS",
            "includes_text": data.get("includes_text"),
            "is_negotiable": bool(data.get("is_negotiable", False)),
        }
        try:
            return await self._sql.execute(
                ProviderServicePricingQueryIds.UPSERT, params, fetch="one"
            )
        except IntegrityError as exc:
            raise ConflictError(
                "Pricing rejected — the service must be configured first and "
                "the amounts must satisfy the pricing model's constraints"
            ) from exc

    async def clear_pricing(self, provider_id: str, service_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderServicePricingQueryIds.CLEAR,
            {"user_id": provider_id, "service_id": service_id},
            fetch="one",
        )
