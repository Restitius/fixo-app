"""Provider ratings & reviews router (Requirement Phase 33).

Prefix: /providers/me/ratings

- GET /        — list reviews (optional status and min_rating filters)
- GET /summary — rating summary (total, average, star distribution, this-month)
- GET /{review_id} — single review
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_reviews_service import (
    ProviderReviewsService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/ratings", tags=["provider-ratings"])


def _service(
    provider_id: str = Depends(get_current_provider),
) -> ProviderReviewsService:
    return get_composition().provider_reviews_service(provider_id=provider_id)


@router.get("/")
async def list_reviews(
    status: str | None = Query(None, pattern="published|all"),
    min_rating: int | None = Query(None, ge=1, le=5),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    svc: ProviderReviewsService = Depends(_service),
) -> list[Any]:
    """List provider reviews with optional filters."""
    return await svc.list_reviews(
        status=status, min_rating=min_rating, limit=limit, offset=offset
    )


@router.get("/summary")
async def get_summary(
    svc: ProviderReviewsService = Depends(_service),
) -> Any:
    """Return provider rating summary."""
    return await svc.get_summary()


@router.get("/{review_id}")
async def get_review(
    review_id: str,
    svc: ProviderReviewsService = Depends(_service),
) -> Any:
    """Return a single review by id (ownership-checked)."""
    return await svc.get_review(review_id=review_id)