"""ProviderReviewsService — provider ratings & reviews (Requirement Phase 33).

Exposes provider-facing review visibility: list reviews (with optional status
and minimum rating filters), fetch a single review by id (ownership-scoped),
and return a summary (total, average rating, star distribution, this-month
count).

Review statuses: published, hidden, flagged.

Read-only in this phase — no review submission, response, or moderation.
"""

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError


# -- pagination defaults ----------------------------------------------------------
DEFAULT_LIMIT = 50
MAX_LIMIT = 100

# -- review status filter values --------------------------------------------------
REVIEW_STATUSES = frozenset({"published", "hidden", "flagged", "all"})


class ProviderReviewsService:
    """Domain service for provider review read operations."""

    def __init__(self, reviews: Any) -> None:
        self._reviews = reviews

    # -- reviews --------------------------------------------------------------------

    async def list_reviews(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        min_rating: int | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List provider reviews with optional filters.

        Args:
            status: filter by review status (published|hidden|flagged|all).
                None means no status filter.
            min_rating: minimum rating inclusive (1-5). None means no minimum.
            limit: max rows to return (1-100).
            offset: rows to skip for pagination.

        Returns a structured dict with reviews list and pagination metadata.
        """
        if status is not None and status not in REVIEW_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(REVIEW_STATUSES))}"
            )
        if min_rating is not None and (min_rating < 1 or min_rating > 5):
            raise ValidationError("min_rating must be between 1 and 5")
        if limit < 1 or limit > MAX_LIMIT:
            raise ValidationError(f"limit must be between 1 and {MAX_LIMIT}")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._reviews.list(
            provider_id,
            status=status,
            min_rating=min_rating,
            limit=limit,
            offset=offset,
        )
        return {
            "reviews": [self._encode_review(r) for r in rows],
            "limit": limit,
            "offset": offset,
        }

    async def get_review(self, provider_id: str, *, review_id: str) -> dict[str, Any]:
        """Fetch a single review by id (ownership-checked).

        Raises NotFoundError when the review does not exist or is not owned by
        the requesting provider.
        """
        row = await self._reviews.detail(provider_id, review_id=review_id)
        if row is None:
            raise NotFoundError("Review not found")
        return self._encode_review(row)

    async def get_summary(self, provider_id: str) -> dict[str, Any]:
        """Return provider review summary: total, average, star distribution."""
        row = await self._reviews.summary(provider_id)
        if row is None:
            return {
                "total_count": 0,
                "average_rating": 0,
                "five_star": 0,
                "four_star": 0,
                "three_star": 0,
                "two_star": 0,
                "one_star": 0,
                "this_month": 0,
            }
        return self._encode_summary(row)

    # -- encoding helpers -----------------------------------------------------------

    @staticmethod
    def _encode_review(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a review row for API output."""
        return {
            "id": str(row.get("id") or ""),
            "booking_id": str(row.get("booking_id") or ""),
            "customer_id": str(row.get("customer_id") or ""),
            "rating": int(row.get("rating") or 0),
            "title": str(row.get("title") or ""),
            "body": str(row.get("body") or ""),
            "status": str(row.get("status") or "published"),
            "created_at": row.get("created_at"),
        }

    @staticmethod
    def _encode_summary(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a review summary row for API output."""
        return {
            "total_count": int(row.get("total_count") or 0),
            "average_rating": float(row.get("average_rating") or 0),
            "five_star": int(row.get("five_star") or 0),
            "four_star": int(row.get("four_star") or 0),
            "three_star": int(row.get("three_star") or 0),
            "two_star": int(row.get("two_star") or 0),
            "one_star": int(row.get("one_star") or 0),
            "this_month": int(row.get("this_month") or 0),
        }