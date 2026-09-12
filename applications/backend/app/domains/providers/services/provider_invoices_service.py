from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError


class ProviderInvoicesService:
    def __init__(self, invoices: Any) -> None:
        self._invoices = invoices

    async def list_invoices(self, provider_id: str, *, limit: int = 50, offset: int = 0) -> list[Any]:
        return await self._invoices.list(provider_id, limit=limit, offset=offset)

    async def get_invoice(self, provider_id: str, *, invoice_id: str) -> Any:
        row = await self._invoices.get(provider_id, invoice_id=invoice_id)
        if not row:
            raise NotFoundError("invoice not found")
        return row

    async def get_summary(self, provider_id: str) -> Any:
        return await self._invoices.summary(provider_id)