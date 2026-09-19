"""ProviderPromotionsService - business rules for provider promotion codes."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from app.ports.persistence.provider_promotions_repository import ProviderPromotionsRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError, ValidationError

_DISCOUNT_TYPES = {"PERCENT", "FIXED_AMOUNT"}


def _validate_terms(
    discount_type: str, discount_value: float, valid_from: datetime, valid_until: datetime
) -> None:
    if discount_type not in _DISCOUNT_TYPES:
        raise ValidationError(f"Unknown discount_type '{discount_type}'")
    if discount_value < 0:
        raise ValidationError("discount_value must be >= 0")
    if discount_type == "PERCENT" and discount_value > 100:
        raise ValidationError("A percent discount cannot exceed 100")
    if valid_until <= valid_from:
        raise ValidationError("valid_until must be after valid_from")


class ProviderPromotionsService:
    def __init__(self, repository: ProviderPromotionsRepositoryPort) -> None:
        self._repo = repository

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
    ) -> dict[str, Any]:
        code = (code or "").strip().upper()
        name = (name or "").strip()
        discount_type = (discount_type or "").upper()
        if not 2 <= len(code) <= 40:
            raise ValidationError("code must be 2-40 characters")
        if not name:
            raise ValidationError("name is required")
        _validate_terms(discount_type, discount_value, valid_from, valid_until)
        record = await self._repo.create(
            provider_id, code=code, name=name, description=description,
            discount_type=discount_type, discount_value=discount_value, min_amount=min_amount,
            max_discount=max_discount, usage_limit=usage_limit,
            valid_from=valid_from, valid_until=valid_until,
        )
        if record is None:
            raise RuntimeError("Failed to create promotion")
        return record

    async def list_promotions(
        self, provider_id: str, *, active: bool | None = None, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._repo.list_promotions(provider_id, active=active, limit=limit, offset=offset)

    async def get(self, provider_id: str, *, promo_id: str) -> dict[str, Any]:
        record = await self._repo.get(provider_id, promo_id=promo_id)
        if record is None:
            raise NotFoundError("Promotion not found")
        return record

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
    ) -> dict[str, Any]:
        if discount_type is not None or discount_value is not None or valid_from is not None or valid_until is not None:
            existing = await self.get(provider_id, promo_id=promo_id)
            effective_type = (discount_type or existing["discount_type"]).upper()
            effective_value = discount_value if discount_value is not None else float(existing["discount_value"])
            effective_from = valid_from or existing["valid_from"]
            effective_until = valid_until or existing["valid_until"]
            _validate_terms(effective_type, effective_value, effective_from, effective_until)
        record = await self._repo.update(
            provider_id,
            promo_id=promo_id,
            name=name,
            description=description,
            discount_type=(discount_type.upper() if discount_type else None),
            discount_value=discount_value,
            min_amount=min_amount,
            max_discount=max_discount,
            usage_limit=usage_limit,
            valid_from=valid_from,
            valid_until=valid_until,
        )
        if record is None:
            raise NotFoundError("Promotion not found")
        return record

    async def deactivate(self, provider_id: str, *, promo_id: str) -> dict[str, Any]:
        await self.get(provider_id, promo_id=promo_id)
        result = await self._repo.deactivate(provider_id, promo_id=promo_id)
        if result is None:
            raise ConflictError("Promotion is already inactive")
        return result

    async def validate_code(
        self, provider_id: str, *, code: str, amount: float
    ) -> dict[str, Any]:
        if amount < 0:
            raise ValidationError("amount must be >= 0")
        result = await self._repo.validate(provider_id, code=(code or "").strip().upper(), amount=amount)
        if result is None:
            raise NotFoundError("Code is invalid, expired, exhausted, or below the minimum amount")
        return result

    async def redeem(self, provider_id: str, *, promo_id: str) -> dict[str, Any]:
        result = await self._repo.redeem(provider_id, promo_id=promo_id)
        if result is None:
            raise ConflictError("Promotion is inactive, out of its valid window, or exhausted")
        return result
