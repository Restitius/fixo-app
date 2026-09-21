"""Provider portfolio router (Requirement Phase 36).

Prefix: /providers/me/portfolio

- GET /                list portfolio items
- GET /{item_id}        single portfolio item
- POST /               add a portfolio item
- PATCH /{item_id}      update a portfolio item
- DELETE /{item_id}     remove a portfolio item
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_portfolio_service import (
    ProviderPortfolioService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/portfolio", tags=["provider-portfolio"])


def _service() -> ProviderPortfolioService:
    return get_composition().provider_portfolio_service()


# -- request / response models ---------------------------------------------------

class PortfolioItemBody(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    description: str | None = Field(None, max_length=4000)
    service_category: str | None = Field(None, max_length=64)
    before_image_url: str | None = Field(None, max_length=512)
    after_image_url: str | None = Field(None, max_length=512)
    completed_on: str | None = None
    is_featured: bool = False
    status: str = Field("published", pattern="published|draft|archived")


class PortfolioUpdateBody(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=256)
    description: str | None = Field(None, max_length=4000)
    service_category: str | None = Field(None, max_length=64)
    before_image_url: str | None = Field(None, max_length=512)
    after_image_url: str | None = Field(None, max_length=512)
    completed_on: str | None = None
    is_featured: bool | None = None
    status: str | None = Field(None, pattern="published|draft|archived")


# -- endpoints ------------------------------------------------------------------

@router.get("/")
async def list_items(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """List provider portfolio items, featured first then newest."""
    svc = _service()
    return await svc.list_items(
        provider_id=str(provider["provider_id"]),
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/{item_id}")
async def get_item(
    item_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Fetch a single portfolio item by id (ownership-checked)."""
    svc = _service()
    return await svc.get_item(
        provider_id=str(provider["provider_id"]), portfolio_id=item_id
    )


@router.post("/")
async def add_item(
    body: PortfolioItemBody,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Create a new portfolio item."""
    svc = _service()
    return await svc.add_item(
        provider_id=str(provider["provider_id"]),
        title=body.title,
        description=body.description,
        service_category=body.service_category,
        before_image_url=body.before_image_url,
        after_image_url=body.after_image_url,
        completed_on=body.completed_on,
        is_featured=body.is_featured,
        status=body.status,
    )


@router.patch("/{item_id}")
async def update_item(
    item_id: str,
    body: PortfolioUpdateBody,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Update an existing portfolio item (ownership-scoped)."""
    svc = _service()
    return await svc.update_item(
        provider_id=str(provider["provider_id"]),
        portfolio_id=item_id,
        title=body.title,
        description=body.description,
        service_category=body.service_category,
        before_image_url=body.before_image_url,
        after_image_url=body.after_image_url,
        completed_on=body.completed_on,
        is_featured=body.is_featured,
        status=body.status,
    )


@router.delete("/{item_id}")
async def delete_item(
    item_id: str,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    """Remove a portfolio item (ownership-scoped)."""
    svc = _service()
    return await svc.delete_item(
        provider_id=str(provider["provider_id"]), portfolio_id=item_id
    )
