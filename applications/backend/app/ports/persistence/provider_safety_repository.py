"""Provider safety/incident report persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderSafetyRepositoryPort(Protocol):
    async def create_report(
        self,
        provider_id: str,
        *,
        booking_id: str | None,
        category: str,
        severity: str,
        description: str,
    ) -> dict[str, Any] | None:
        ...

    async def list_reports(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        ...

    async def get_report(self, provider_id: str, *, report_id: str) -> dict[str, Any] | None:
        ...

    async def escalate(self, provider_id: str, *, report_id: str) -> dict[str, Any] | None:
        ...
