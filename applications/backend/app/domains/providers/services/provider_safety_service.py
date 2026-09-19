"""ProviderSafetyService - business rules for provider safety/incident reports."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_safety_repository import ProviderSafetyRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError

_CATEGORIES = {"UNSAFE_CUSTOMER", "PROPERTY_HAZARD", "INJURY", "HARASSMENT", "OTHER"}
_SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}


class ProviderSafetyService:
    def __init__(self, repository: ProviderSafetyRepositoryPort) -> None:
        self._repo = repository

    async def create_report(
        self,
        provider_id: str,
        *,
        booking_id: str | None,
        category: str,
        severity: str,
        description: str,
    ) -> dict[str, Any]:
        category = (category or "OTHER").upper()
        severity = (severity or "LOW").upper()
        description = (description or "").strip()
        if category not in _CATEGORIES:
            raise ValueError(f"Unknown category '{category}'")
        if severity not in _SEVERITIES:
            raise ValueError(f"Unknown severity '{severity}'")
        if not 10 <= len(description) <= 4000:
            raise ValueError("Description must be 10-4000 characters")
        report = await self._repo.create_report(
            provider_id,
            booking_id=booking_id,
            category=category,
            severity=severity,
            description=description,
        )
        if report is None:
            raise NotFoundError("Booking not found for this provider")
        return report

    async def list_reports(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._repo.list_reports(
            provider_id, status=status, category=category, limit=limit, offset=offset
        )

    async def get_report(self, provider_id: str, *, report_id: str) -> dict[str, Any]:
        report = await self._repo.get_report(provider_id, report_id=report_id)
        if report is None:
            raise NotFoundError("Safety report not found")
        return report

    async def escalate(self, provider_id: str, *, report_id: str) -> dict[str, Any]:
        await self.get_report(provider_id, report_id=report_id)
        result = await self._repo.escalate(provider_id, report_id=report_id)
        if result is None:
            raise ConflictError("Report is already escalated or resolved")
        return result
