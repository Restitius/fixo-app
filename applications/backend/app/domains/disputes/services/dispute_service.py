"""DisputeService - open, evidence, withdraw; guards live in SQL."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.dispute_repository import DisputeRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError

_CATEGORIES = {"QUALITY", "DAMAGE", "BILLING", "CONDUCT", "OTHER"}
_KINDS = {"PHOTO", "DOCUMENT", "MESSAGE", "RECEIPT"}


class DisputeService:
    def __init__(self, repository: DisputeRepositoryPort) -> None:
        self._repo = repository

    async def open_dispute(
        self, booking_id: str, customer_id: str, category: str, description: str
    ) -> dict[str, Any]:
        category = (category or "").upper()
        description = (description or "").strip()
        if category not in _CATEGORIES:
            raise ValueError(f"Unknown dispute category '{category}'")
        if not 10 <= len(description) <= 2000:
            raise ValueError("Description must be 10-2000 characters")
        dispute = await self._repo.create_dispute(booking_id, customer_id, category, description)
        if dispute is None:
            # Either the booking doesn't exist/isn't owned, or it already has
            # an active (OPEN/UNDER_REVIEW) dispute — the SQL folds both into
            # zero rows. The latter is far likelier in practice (booking_id
            # normally comes from an already-fetched booking), so surface it
            # as a conflict rather than a bare 404.
            raise ConflictError("Booking not found, not yours, or already has an active dispute")
        return dispute

    async def list_disputes(
        self, customer_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._repo.list_disputes(customer_id, limit=limit, offset=offset)

    async def get_dispute(self, dispute_id: str, customer_id: str) -> dict[str, Any]:
        dispute = await self._repo.get_dispute(dispute_id, customer_id)
        if dispute is None:
            raise NotFoundError("Dispute not found")
        return dispute

    async def add_evidence(
        self,
        dispute_id: str,
        customer_id: str,
        kind: str,
        url: str,
        note: str | None = None,
    ) -> dict[str, Any]:
        kind = (kind or "").upper()
        if kind not in _KINDS:
            raise ValueError(f"Unknown evidence kind '{kind}'")
        # Existence/ownership first (404), so a wrong-state failure below is
        # unambiguously a conflict (409), not a guess between the two.
        await self.get_dispute(dispute_id, customer_id)
        evidence = await self._repo.add_evidence(dispute_id, customer_id, kind, url, note)
        if evidence is None:
            raise ConflictError("Dispute no longer accepts evidence")
        return evidence

    async def list_evidence(self, dispute_id: str, customer_id: str) -> list[dict[str, Any]]:
        await self.get_dispute(dispute_id, customer_id)
        return await self._repo.list_evidence(dispute_id, customer_id)

    async def withdraw(self, dispute_id: str, customer_id: str) -> dict[str, Any]:
        await self.get_dispute(dispute_id, customer_id)
        withdrawn = await self._repo.withdraw_dispute(dispute_id, customer_id)
        if withdrawn is None:
            raise ConflictError("Dispute already resolved")
        return withdrawn
