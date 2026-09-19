"""ProviderDisputesService — provider-facing disputes (Requirement Phase 39).

Exposes provider dispute visibility and response on their own bookings:
- list disputes (optional status + booking filters) with pagination,
- fetch a single dispute by id (ownership-scoped),
- list evidence for a dispute (ownership-scoped),
- submit a response (kind must be acknowledgment/explanation/refund_offer,
  body required), and list responses already given.

Resolution itself stays platform/admin-side in this phase — the provider sees
dispute state and can respond, but the resolution decision is not theirs.
"""

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

# -- pagination defaults -------------------------------------------------------
DEFAULT_LIMIT = 50
MAX_LIMIT = 100

# -- dispute status filter values ----------------------------------------------
DISPUTE_LIST_STATUSES = frozenset({"open", "under_review", "resolved", "withdrawn", "all"})

# -- provider response kinds ---------------------------------------------------
RESPONSE_KINDS = frozenset({"acknowledgment", "explanation", "refund_offer"})


class ProviderDisputesService:
    """Domain service for provider dispute operations."""

    def __init__(self, disputes: Any) -> None:
        self._disputes = disputes

    # -- disputes ---------------------------------------------------------------

    async def list_disputes(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        booking_id: str | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List provider disputes with optional filters."""
        if status is not None and status not in DISPUTE_LIST_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(DISPUTE_LIST_STATUSES))}"
            )
        if limit < 1 or limit > MAX_LIMIT:
            raise ValidationError(f"limit must be between 1 and {MAX_LIMIT}")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._disputes.list(
            provider_id,
            status=None if status == "all" else status,
            booking_id=booking_id,
            limit=limit,
            offset=offset,
        )
        return {
            "disputes": [self._encode_dispute(r) for r in rows],
            "limit": limit,
            "offset": offset,
        }

    async def get_dispute(
        self, provider_id: str, *, dispute_id: str
    ) -> dict[str, Any]:
        """Fetch a single dispute by id (ownership-checked)."""
        row = await self._disputes.get(provider_id, dispute_id=dispute_id)
        if row is None:
            raise NotFoundError("Dispute not found")
        return self._encode_dispute(row)

    async def list_evidence(
        self, provider_id: str, *, dispute_id: str
    ) -> dict[str, Any]:
        """List evidence on a dispute (ownership-checked)."""
        existing = await self._disputes.get(provider_id, dispute_id=dispute_id)
        if existing is None:
            raise NotFoundError("Dispute not found")
        rows = await self._disputes.list_evidence(provider_id, dispute_id=dispute_id)
        return {
            "dispute_id": dispute_id,
            "evidence": [self._encode_evidence(r) for r in rows],
        }

    async def respond(
        self, provider_id: str, *, dispute_id: str, kind: str, body: str
    ) -> dict[str, Any]:
        """Submit a provider response on an owned dispute."""
        if kind not in RESPONSE_KINDS:
            raise ValidationError(
                f"kind must be one of: {', '.join(sorted(RESPONSE_KINDS))}"
            )
        if not body or not body.strip():
            raise ValidationError("body is required")
        if len(body.strip()) > 4000:
            raise ValidationError("body must be at most 4000 characters")
        row = await self._disputes.respond(
            provider_id, dispute_id=dispute_id, kind=kind, body=body.strip()
        )
        if row is None:
            raise ValidationError(
                "Response could not be added (dispute missing, not owned, or already closed)"
            )
        return self._encode_response(row)

    async def list_responses(
        self, provider_id: str, *, dispute_id: str
    ) -> dict[str, Any]:
        """List provider responses for a dispute (ownership-checked)."""
        existing = await self._disputes.get(provider_id, dispute_id=dispute_id)
        if existing is None:
            raise NotFoundError("Dispute not found")
        rows = await self._disputes.list_responses(provider_id, dispute_id=dispute_id)
        return {
            "dispute_id": dispute_id,
            "responses": [self._encode_response(r) for r in rows],
        }

    # -- encoding helpers -------------------------------------------------------

    @staticmethod
    def _encode_dispute(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a dispute row for API output."""
        return {
            "dispute_id": str(row.get("dispute_id") or ""),
            "dispute_number": str(row.get("dispute_number") or ""),
            "booking_id": str(row.get("booking_id") or ""),
            "booking_number": str(row.get("booking_number") or ""),
            "category": str(row.get("category") or ""),
            "status": str(row.get("status") or ""),
            "description": str(row.get("description") or ""),
            "resolution": row.get("resolution"),
            "created_at": row.get("created_at"),
            "resolved_at": row.get("resolved_at"),
            "evidence_count": int(row.get("evidence_count") or 0),
        }

    @staticmethod
    def _encode_evidence(row: dict[str, Any]) -> dict[str, Any]:
        """Shape an evidence row for API output."""
        return {
            "evidence_id": str(row.get("evidence_id") or ""),
            "kind": str(row.get("kind") or ""),
            "url": str(row.get("url") or ""),
            "note": row.get("note"),
            "created_at": row.get("created_at"),
        }

    @staticmethod
    def _encode_response(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a provider response row for API output."""
        return {
            "response_id": str(row.get("response_id") or ""),
            "dispute_id": str(row.get("dispute_id") or ""),
            "kind": str(row.get("kind") or ""),
            "body": str(row.get("body") or ""),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }