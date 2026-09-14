"""ProviderPromotionsSqlAdapter - the only layer that knows the PROV.PROMOTIONS.* IDs."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.exc import IntegrityError

from app.ports.persistence.provider_promotions_repository import ProviderPromotionsRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError

_LIMIT_CAP = 100


class ProviderPromotionsSqlAdapter(ProviderPromotionsRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def create(
        self,
        provider_id: str,
        *,
        code: str,
        name: str,
        description: str | None,
        discount_type: str,
        discount_value: float,
        min_amount: float,
        max_discount: float | None,
        usage_limit: int | None,
        valid_from: datetime,
        valid_until: datetime,
    ) -> dict[str, Any] | None:
        try:
            rows = await self._queries.execute(
                "PROV.PROMOTIONS.CREATE",
                {
                    "provider_id": provider_id,
                    "code": code,
                    "name": name,
                    "description": description,
                    "discount_type": discount_type,
                    "discount_value": discount_value,
                    "min_amount": min_amount,
                    "max_discount": max_discount,
                    "usage_limit": usage_limit,
                    "valid_from": valid_from,
                    "valid_until": valid_until,
                },
            )
        except IntegrityError as exc:
            raise ConflictError(
                "This code is already in use, or the promotion terms are invalid "
                "(discount must be non-negative, and the end date must be after the start date)"
            ) from exc
        return rows[0] if rows else None

    async def list_promotions(
        self, provider_id: str, *, active: bool | None = None, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.PROMOTIONS.LIST",
            {
                "user_id": provider_id,
                "active": active,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get(self, provider_id: str, *, promo_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.PROMOTIONS.GET",
            {"user_id": provider_id, "promo_id": promo_id},
        )
        return rows[0] if rows else None

    async def update(
        self,
        provider_id: str,
        *,
        promo_id: str,
        name: str | None = None,
        description: str | None = None,
        discount_type: str | None = None,
        discount_value: float | None = None,
        min_amount: float | None = None,
        max_discount: float | None = None,
        usage_limit: int | None = None,
        valid_from: datetime | None = None,
        valid_until: datetime | None = None,
    ) -> dict[str, Any] | None:
        try:
            rows = await self._queries.execute(
                "PROV.PROMOTIONS.UPDATE",
                {
                    "user_id": provider_id,
                    "promo_id": promo_id,
                    "name": name,
                    "description": description,
                    "discount_type": discount_type,
                    "discount_value": discount_value,
                    "min_amount": min_amount,
                    "max_discount": max_discount,
                    "usage_limit": usage_limit,
                    "valid_from": valid_from,
                    "valid_until": valid_until,
                },
            )
        except IntegrityError as exc:
            raise ConflictError("Update rejected by data constraints") from exc
        return rows[0] if rows else None

    async def deactivate(self, provider_id: str, *, promo_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.PROMOTIONS.DEACTIVATE",
            {"user_id": provider_id, "promo_id": promo_id},
        )
        return rows[0] if rows else None

    async def validate(
        self, provider_id: str, *, code: str, amount: float
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.PROMOTIONS.VALIDATE",
            {"user_id": provider_id, "code": code, "amount": amount},
        )
        return rows[0] if rows else None

    async def redeem(self, provider_id: str, *, promo_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.PROMOTIONS.REDEEM",
            {"user_id": provider_id, "promo_id": promo_id},
        )
        return rows[0] if rows else None
