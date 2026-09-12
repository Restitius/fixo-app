"""ProviderPortfolioService — provider portfolio (Requirement Phase 36).

Manages a provider's work portfolio — completed job showcases with title,
description, service category, before/after image references, and completion
date. Supports full CRUD lifecycle.

Portfolio statuses: published, draft, archived.

Featured items are pinned to the top of listings.
"""

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError


# -- pagination defaults ----------------------------------------------------------
DEFAULT_LIMIT = 50
MAX_LIMIT = 100

# -- portfolio status values ------------------------------------------------------
PORTFOLIO_STATUSES = frozenset({"published", "draft", "archived"})


class ProviderPortfolioService:
    """Domain service for provider portfolio CRUD operations."""

    def __init__(self, portfolio: Any) -> None:
        self._portfolio = portfolio

    # -- portfolio ------------------------------------------------------------------

    async def list_items(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List provider portfolio items, featured first then newest."""
        if status is not None and status not in PORTFOLIO_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(PORTFOLIO_STATUSES))}"
            )
        if limit < 1 or limit > MAX_LIMIT:
            raise ValidationError(f"limit must be between 1 and {MAX_LIMIT}")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._portfolio.list(
            provider_id, status=status, limit=limit, offset=offset
        )
        return {
            "items": [self._encode_item(r) for r in rows],
            "limit": limit,
            "offset": offset,
        }

    async def get_item(self, provider_id: str, *, portfolio_id: str) -> dict[str, Any]:
        """Fetch a single portfolio item by id (ownership-checked)."""
        row = await self._portfolio.get(provider_id, portfolio_id=portfolio_id)
        if row is None:
            raise NotFoundError("Portfolio item not found")
        return self._encode_item(row)

    async def add_item(
        self,
        provider_id: str,
        *,
        title: str,
        description: str | None = None,
        service_category: str | None = None,
        before_image_url: str | None = None,
        after_image_url: str | None = None,
        completed_on: str | None = None,
        is_featured: bool = False,
        status: str = "published",
    ) -> dict[str, Any]:
        """Create a new portfolio item for the provider."""
        title = (title or "").strip()
        if not title:
            raise ValidationError("title is required")
        if len(title) > 256:
            raise ValidationError("title must be 256 characters or fewer")
        if status not in PORTFOLIO_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(PORTFOLIO_STATUSES))}"
            )
        row = await self._portfolio.add(
            provider_id,
            title=title,
            description=description,
            service_category=service_category,
            before_image_url=before_image_url,
            after_image_url=after_image_url,
            completed_on=completed_on,
            is_featured=is_featured,
            status=status,
        )
        if row is None:
            raise ValidationError("Failed to create portfolio item")
        return self._encode_item(row)

    async def update_item(
        self,
        provider_id: str,
        *,
        portfolio_id: str,
        title: str | None = None,
        description: str | None = None,
        service_category: str | None = None,
        before_image_url: str | None = None,
        after_image_url: str | None = None,
        completed_on: str | None = None,
        is_featured: bool | None = None,
        status: str | None = None,
    ) -> dict[str, Any]:
        """Update an existing portfolio item (ownership-scoped)."""
        if status is not None and status not in PORTFOLIO_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(PORTFOLIO_STATUSES))}"
            )
        if title is not None:
            title = title.strip()
            if not title:
                raise ValidationError("title cannot be empty")
            if len(title) > 256:
                raise ValidationError("title must be 256 characters or fewer")
        row = await self._portfolio.update(
            provider_id,
            portfolio_id=portfolio_id,
            title=title,
            description=description,
            service_category=service_category,
            before_image_url=before_image_url,
            after_image_url=after_image_url,
            completed_on=completed_on,
            is_featured=is_featured,
            status=status,
        )
        if row is None:
            raise NotFoundError("Portfolio item not found")
        return self._encode_item(row)

    async def delete_item(self, provider_id: str, *, portfolio_id: str) -> dict[str, Any]:
        """Remove a portfolio item (ownership-scoped)."""
        row = await self._portfolio.delete(provider_id, portfolio_id=portfolio_id)
        if row is None:
            raise NotFoundError("Portfolio item not found")
        return {"id": str(row.get("id") or "")}

    # -- encoding helpers -----------------------------------------------------------

    @staticmethod
    def _encode_item(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a portfolio row for API output."""
        return {
            "id": str(row.get("id") or ""),
            "title": str(row.get("title") or ""),
            "description": str(row.get("description") or ""),
            "service_category": str(row.get("service_category") or ""),
            "before_image_url": str(row.get("before_image_url") or ""),
            "after_image_url": str(row.get("after_image_url") or ""),
            "completed_on": str(row.get("completed_on") or ""),
            "is_featured": bool(row.get("is_featured")),
            "status": str(row.get("status") or "published"),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }
