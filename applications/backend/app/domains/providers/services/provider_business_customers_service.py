"""ProviderBusinessCustomersService - business rules for negotiated-rate customers."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_business_customers_repository import (
    ProviderBusinessCustomersRepositoryPort,
)
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError, ValidationError

_RATE_TYPES = {"PERCENT_DISCOUNT", "FIXED_RATE"}


def _validate_rate(rate_type: str, rate_value: float) -> None:
    if rate_type not in _RATE_TYPES:
        raise ValidationError(f"Unknown negotiated_rate_type '{rate_type}'")
    if rate_value < 0:
        raise ValidationError("negotiated_rate_value must be >= 0")
    if rate_type == "PERCENT_DISCOUNT" and rate_value > 100:
        raise ValidationError("A percent discount cannot exceed 100")


class ProviderBusinessCustomersService:
    def __init__(self, repository: ProviderBusinessCustomersRepositoryPort) -> None:
        self._repo = repository

    async def create(
        self,
        provider_id: str,
        *,
        customer_id: str,
        company_name: str | None,
        negotiated_rate_type: str,
        negotiated_rate_value: float,
        notes: str | None,
    ) -> dict[str, Any]:
        negotiated_rate_type = (negotiated_rate_type or "").upper()
        _validate_rate(negotiated_rate_type, negotiated_rate_value)
        record = await self._repo.create(
            provider_id,
            customer_id=customer_id,
            company_name=company_name,
            negotiated_rate_type=negotiated_rate_type,
            negotiated_rate_value=negotiated_rate_value,
            notes=notes,
        )
        if record is None:
            raise NotFoundError("Customer not found")
        return record

    async def list_customers(
        self, provider_id: str, *, status: str | None = None, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._repo.list_customers(provider_id, status=status, limit=limit, offset=offset)

    async def get(self, provider_id: str, *, record_id: str) -> dict[str, Any]:
        record = await self._repo.get(provider_id, record_id=record_id)
        if record is None:
            raise NotFoundError("Business customer record not found")
        return record

    async def update(
        self,
        provider_id: str,
        *,
        record_id: str,
        company_name: str | None = None,
        negotiated_rate_type: str | None = None,
        negotiated_rate_value: float | None = None,
        notes: str | None = None,
    ) -> dict[str, Any]:
        if negotiated_rate_type is not None or negotiated_rate_value is not None:
            existing = await self.get(provider_id, record_id=record_id)
            effective_type = (negotiated_rate_type or existing["negotiated_rate_type"]).upper()
            effective_value = (
                negotiated_rate_value if negotiated_rate_value is not None
                else existing["negotiated_rate_value"]
            )
            _validate_rate(effective_type, float(effective_value))
        record = await self._repo.update(
            provider_id,
            record_id=record_id,
            company_name=company_name,
            negotiated_rate_type=(negotiated_rate_type or "").upper() or None,
            negotiated_rate_value=negotiated_rate_value,
            notes=notes,
        )
        if record is None:
            raise NotFoundError("Business customer record not found")
        return record

    async def deactivate(self, provider_id: str, *, record_id: str) -> dict[str, Any]:
        await self.get(provider_id, record_id=record_id)
        result = await self._repo.deactivate(provider_id, record_id=record_id)
        if result is None:
            raise ConflictError("Record is already inactive")
        return result
