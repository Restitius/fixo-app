"""Provider promotions persistence port - business-facing contract only."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol


class ProviderPromotionsRepositoryPort(Protocol):
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
        ...

    async def list_promotions(
        self, provider_id: str, *, active: bool | None = None, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        ...

    async def get(self, provider_id: str, *, promo_id: str) -> dict[str, Any] | None:
        ...

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
        ...

    async def deactivate(self, provider_id: str, *, promo_id: str) -> dict[str, Any] | None:
        ...

    async def validate(
        self, provider_id: str, *, code: str, amount: float
    ) -> dict[str, Any] | None:
        ...

    async def redeem(self, provider_id: str, *, promo_id: str) -> dict[str, Any] | None:
        ...
