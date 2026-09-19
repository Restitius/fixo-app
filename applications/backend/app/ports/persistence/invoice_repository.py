"""Invoice repository port — business-facing contract for invoices."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class InvoiceRepositoryPort(ABC):
    @abstractmethod
    async def finalize(
        self, customer_id: str, booking_id: str, tax_rate: float | None = None
    ) -> dict[str, Any]: ...

    @abstractmethod
    async def issue(self, customer_id: str, invoice_id: str) -> dict[str, Any]: ...

    @abstractmethod
    async def get_by_booking(self, customer_id: str, booking_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def get_owned(self, customer_id: str, invoice_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def list(self, customer_id: str, *, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def mark_paid(self, customer_id: str, invoice_id: str) -> dict[str, Any]: ...
