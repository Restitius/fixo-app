"""ProviderBusinessCustomersSqlAdapter - the only layer that knows the PROV.BUSINESS_CUSTOMERS.* IDs."""
from __future__ import annotations

from typing import Any

from sqlalchemy.exc import IntegrityError

from app.ports.persistence.provider_business_customers_repository import (
    ProviderBusinessCustomersRepositoryPort,
)
from app.shared.exceptions.hierarchy import ConflictError

_LIMIT_CAP = 100


class ProviderBusinessCustomersSqlAdapter(ProviderBusinessCustomersRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def create(
        self,
        provider_id: str,
        *,
        customer_id: str,
        company_name: str | None,
        negotiated_rate_type: str,
        negotiated_rate_value: float,
        notes: str | None,
    ) -> dict[str, Any] | None:
        try:
            rows = await self._queries.execute(
                "PROV.BUSINESS_CUSTOMERS.CREATE",
                {
                    "provider_id": provider_id,
                    "customer_id": customer_id,
                    "company_name": company_name,
                    "negotiated_rate_type": negotiated_rate_type,
                    "negotiated_rate_value": negotiated_rate_value,
                    "notes": notes,
                },
            )
        except IntegrityError as exc:
            raise ConflictError(
                "This customer is already registered as a business customer"
            ) from exc
        return rows[0] if rows else None

    async def list_customers(
        self, provider_id: str, *, status: str | None = None, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.BUSINESS_CUSTOMERS.LIST",
            {
                "user_id": provider_id,
                "status": status,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get(self, provider_id: str, *, record_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.BUSINESS_CUSTOMERS.GET",
            {"user_id": provider_id, "record_id": record_id},
        )
        return rows[0] if rows else None

    async def update(
        self,
        provider_id: str,
        *,
        record_id: str,
        company_name: str | None = None,
        negotiated_rate_type: str | None = None,
        negotiated_rate_value: float | None = None,
        notes: str | None = None,
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.BUSINESS_CUSTOMERS.UPDATE",
            {
                "user_id": provider_id,
                "record_id": record_id,
                "company_name": company_name,
                "negotiated_rate_type": negotiated_rate_type,
                "negotiated_rate_value": negotiated_rate_value,
                "notes": notes,
            },
        )
        return rows[0] if rows else None

    async def deactivate(self, provider_id: str, *, record_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.BUSINESS_CUSTOMERS.DEACTIVATE",
            {"user_id": provider_id, "record_id": record_id},
        )
        return rows[0] if rows else None
