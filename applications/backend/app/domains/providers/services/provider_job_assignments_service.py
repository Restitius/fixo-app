"""ProviderJobAssignmentsService - business rules for dispatch/technician assignment."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_job_assignments_repository import (
    ProviderJobAssignmentsRepositoryPort,
)
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError, ValidationError

_STATUSES = {"ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "COMPLETED", "CANCELLED"}


class ProviderJobAssignmentsService:
    def __init__(self, repository: ProviderJobAssignmentsRepositoryPort) -> None:
        self._repo = repository

    async def create(
        self, provider_id: str, *, booking_id: str, member_id: str, notes: str | None
    ) -> dict[str, Any]:
        record = await self._repo.create(
            provider_id, booking_id=booking_id, member_id=member_id, notes=notes
        )
        if record is None:
            raise NotFoundError(
                "Booking or team member not found for this provider, or the member is inactive"
            )
        return record

    async def list_assignments(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        member_id: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._repo.list_assignments(
            provider_id, status=status, member_id=member_id, limit=limit, offset=offset
        )

    async def get(self, provider_id: str, *, assignment_id: str) -> dict[str, Any]:
        record = await self._repo.get(provider_id, assignment_id=assignment_id)
        if record is None:
            raise NotFoundError("Job assignment not found")
        return record

    async def update(
        self,
        provider_id: str,
        *,
        assignment_id: str,
        member_id: str | None = None,
        status: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any]:
        if status is not None and status.upper() not in _STATUSES:
            raise ValidationError(f"Unknown status '{status}'")
        record = await self._repo.update(
            provider_id,
            assignment_id=assignment_id,
            member_id=member_id,
            status=(status.upper() if status else None),
            notes=notes,
        )
        if record is None:
            raise NotFoundError(
                "Assignment not found, or the new team member is not an active member of this provider"
            )
        return record

    async def cancel(self, provider_id: str, *, assignment_id: str) -> dict[str, Any]:
        await self.get(provider_id, assignment_id=assignment_id)
        result = await self._repo.cancel(provider_id, assignment_id=assignment_id)
        if result is None:
            raise ConflictError("Assignment is already completed or cancelled")
        return result
