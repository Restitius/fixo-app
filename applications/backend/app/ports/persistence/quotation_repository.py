"""QuotationRepository — persistence port for quotations.

CUS.QUOTES.* IDs live only in QuotationSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class QuotationRepository(Protocol):
    async def auto_create(
        self, request_id: str, quote: dict[str, Any]
    ) -> dict[str, Any] | None: ...
    async def list_for_request(
        self, customer_id: str, request_id: str
    ) -> list[dict[str, Any]]: ...
    async def get_owned(
        self, customer_id: str, quote_id: str
    ) -> dict[str, Any] | None: ...
    async def accept(
        self, customer_id: str, request_id: str, quote_id: str
    ) -> bool: ...