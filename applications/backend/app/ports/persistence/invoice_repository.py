"""Invoice repository port — business-facing contract for invoices."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any

class InvoiceRepositoryPort(ABC):
    @abstractmethod
    async def finalize(self, booking_id: str, customer_id: str) -> dict[str, Any]: ...

    @abstractmethod
    async def issue(self, invoice_id: str, customer_id: str) -> dict[str, Any]: ...

    @abstractmethod
    async def get_by_booking(self, booking_id: str, customer_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def get_owned(self, invoice_id: str, customer_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def list(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def mark_paid(self, invoice_id: str, customer_id: str) -> dict[str, Any]: ...
