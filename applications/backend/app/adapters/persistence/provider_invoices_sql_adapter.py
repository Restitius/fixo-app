from typing import Any

from app.ports.persistence.provider_invoices_repository import ProviderInvoicesRepository


class ProviderInvoicesSqlAdapter(ProviderInvoicesRepository):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list(self, provider_id: str, *, limit: int = 50, offset: int = 0) -> list[Any]:
        return await self._queries.execute(
            "PROV.INVOICES.LIST",
            {"provider_id": provider_id, "limit": limit, "offset": offset},
        )

    async def get(self, provider_id: str, *, invoice_id: str) -> Any | None:
        rows = await self._queries.execute(
            "PROV.INVOICES.GET",
            {"provider_id": provider_id, "invoice_id": invoice_id},
        )
        return rows[0] if rows else None

    async def summary(self, provider_id: str) -> Any:
        rows = await self._queries.execute(
            "PROV.INVOICES.SUMMARY",
            {"provider_id": provider_id},
        )
        return rows[0] if rows else None