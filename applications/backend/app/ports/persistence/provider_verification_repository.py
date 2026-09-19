"""ProviderVerificationRepository port — identity documents + review workflow (Phase 5)."""
from __future__ import annotations

from datetime import date
from typing import Any, Protocol


class ProviderVerificationRepository(Protocol):
    """Storage contract for provider verification documents and status."""

    async def doc_types(self) -> list[dict[str, Any]]:
        """Governed catalogue of acceptable document types."""
        ...

    async def list_documents(self, provider_id: str) -> list[dict[str, Any]]:
        """The provider's own active (non-withdrawn) documents."""
        ...

    async def list_expiring(self, provider_id: str, *, within_days: int) -> list[dict[str, Any]]:
        """Verified documents expiring within `within_days`, or already expired."""
        ...

    async def add_document(
        self,
        provider_id: str,
        doc_type: str,
        front_image_url: str,
        *,
        back_image_url: str | None = None,
        doc_number: str | None = None,
        issue_date: date | None = None,
        expiry_date: date | None = None,
    ) -> Any | None:
        """Insert one document; None means the type is unknown (FK failure)."""
        ...

    async def delete_document(self, provider_id: str, doc_id: str) -> Any | None:
        """Withdraw a not-yet-verified document (soft delete); None if not withdrawable."""
        ...

    async def status_aggregate(self, provider_id: str) -> Any | None:
        """Verification progress aggregate (counts + required-missing)."""
        ...

    async def submit(self, provider_id: str) -> Any | None:
        """Declare the package submitted; None when the current status forbids it."""
        ...

    async def review_document(
        self,
        doc_id: str,
        reviewer_id: str,
        decision: str,
        review_notes: str | None,
    ) -> Any | None:
        """Platform-side decision on one document; None if not reviewable."""
        ...

    async def set_provider_status(self, provider_id: str, status: str) -> Any | None:
        """Platform-side verification_status transition on the provider row."""
        ...
