"""ProviderEquipmentService - business rules for the provider's equipment registry."""
from __future__ import annotations

from datetime import date
from typing import Any

from app.ports.persistence.provider_equipment_repository import ProviderEquipmentRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError, ValidationError

_CATEGORIES = {"POWER_TOOL", "VEHICLE", "SAFETY_GEAR", "DIAGNOSTIC", "OTHER"}
_CONDITIONS = {"NEW", "GOOD", "FAIR", "POOR"}
_STATUSES = {"AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"}


class ProviderEquipmentService:
    def __init__(self, repository: ProviderEquipmentRepositoryPort) -> None:
        self._repo = repository

    async def create(
        self,
        provider_id: str,
        *,
        name: str,
        category: str,
        serial_number: str | None,
        condition: str,
        purchase_date: date | None,
        notes: str | None,
    ) -> dict[str, Any]:
        name = (name or "").strip()
        category = (category or "OTHER").upper()
        condition = (condition or "GOOD").upper()
        if not 2 <= len(name) <= 150:
            raise ValidationError("name must be 2-150 characters")
        if category not in _CATEGORIES:
            raise ValidationError(f"Unknown category '{category}'")
        if condition not in _CONDITIONS:
            raise ValidationError(f"Unknown condition '{condition}'")
        record = await self._repo.create(
            provider_id, name=name, category=category, serial_number=serial_number,
            condition=condition, purchase_date=purchase_date, notes=notes,
        )
        if record is None:
            raise RuntimeError("Failed to register equipment")
        return record

    async def list_equipment(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._repo.list_equipment(
            provider_id, status=status, category=category, limit=limit, offset=offset
        )

    async def get(self, provider_id: str, *, equipment_id: str) -> dict[str, Any]:
        record = await self._repo.get(provider_id, equipment_id=equipment_id)
        if record is None:
            raise NotFoundError("Equipment not found")
        return record

    async def update(
        self,
        provider_id: str,
        *,
        equipment_id: str,
        name: str | None = None,
        category: str | None = None,
        serial_number: str | None = None,
        condition: str | None = None,
        status: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any]:
        if category is not None and category.upper() not in _CATEGORIES:
            raise ValidationError(f"Unknown category '{category}'")
        if condition is not None and condition.upper() not in _CONDITIONS:
            raise ValidationError(f"Unknown condition '{condition}'")
        if status is not None and status.upper() not in _STATUSES:
            raise ValidationError(f"Unknown status '{status}'")
        record = await self._repo.update(
            provider_id,
            equipment_id=equipment_id,
            name=name,
            category=(category.upper() if category else None),
            serial_number=serial_number,
            condition=(condition.upper() if condition else None),
            status=(status.upper() if status else None),
            notes=notes,
        )
        if record is None:
            raise NotFoundError("Equipment not found")
        return record

    async def assign(
        self, provider_id: str, *, equipment_id: str, member_id: str | None
    ) -> dict[str, Any]:
        await self.get(provider_id, equipment_id=equipment_id)
        result = await self._repo.assign(provider_id, equipment_id=equipment_id, member_id=member_id)
        if result is None:
            raise ConflictError(
                "Equipment is under maintenance or retired, or the team member is not active"
            )
        return result

    async def retire(self, provider_id: str, *, equipment_id: str) -> dict[str, Any]:
        await self.get(provider_id, equipment_id=equipment_id)
        result = await self._repo.retire(provider_id, equipment_id=equipment_id)
        if result is None:
            raise ConflictError("Equipment is already retired")
        return result
