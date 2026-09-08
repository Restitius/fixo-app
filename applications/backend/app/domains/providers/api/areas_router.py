"""Provider service-area routes — where the provider operates (Provider Req Phase 8).

LOCATION-based areas (country/region/city/district/ward/neighborhood),
RADIUS-based areas ("within N km of my location"), the travel policy
(max travel distance, travel fee, free travel radius) and excluded areas.
Static paths are declared before /{area_id} so FastAPI does not shadow them.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/areas", tags=["provider-areas"])


class AreaSettingsRequest(BaseModel):
    """Travel policy + base location (full replace)."""

    base_latitude: float | None = None
    base_longitude: float | None = None
    max_travel_km: float | None = Field(default=None, gt=0)
    travel_fee: float | None = Field(default=None, ge=0)
    free_travel_radius_km: float | None = Field(default=None, ge=0)
    currency: str = Field(default="TZS", max_length=8)
    notes: str | None = Field(default=None, max_length=500)


class AddAreaRequest(BaseModel):
    """One service-area entry: LOCATION (place parts) or RADIUS (centre + km)."""

    area_type: str = Field(max_length=10)
    label: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=80)
    region: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    ward: str | None = Field(default=None, max_length=80)
    neighborhood: str | None = Field(default=None, max_length=80)
    center_latitude: float | None = None
    center_longitude: float | None = None
    radius_km: float | None = Field(default=None, gt=0)
    is_active: bool = True


class UpdateAreaRequest(BaseModel):
    """Partial edit; omitted fields keep their values (area_type immutable)."""

    label: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=80)
    region: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    ward: str | None = Field(default=None, max_length=80)
    neighborhood: str | None = Field(default=None, max_length=80)
    center_latitude: float | None = None
    center_longitude: float | None = None
    radius_km: float | None = Field(default=None, gt=0)
    is_active: bool | None = None


class AddExclusionRequest(BaseModel):
    """An area the provider does not serve (label or any location part)."""

    label: str | None = Field(default=None, max_length=160)
    country: str | None = Field(default=None, max_length=80)
    region: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    ward: str | None = Field(default=None, max_length=80)
    neighborhood: str | None = Field(default=None, max_length=80)


def _service() -> Any:
    return get_composition().provider_area_service()


@router.get("/settings")
async def get_settings(provider: CurrentProvider) -> Any:
    """The provider's travel policy (404 until configured)."""
    return ok(await _service().get_settings(str(provider["provider_id"])))


@router.put("/settings")
async def save_settings(
    payload: AreaSettingsRequest, provider: CurrentProvider
) -> Any:
    """Create or replace the travel/area policy."""
    return ok(
        await _service().save_settings(
            str(provider["provider_id"]), payload.model_dump(exclude_unset=True)
        )
    )


@router.get("/exclusions")
async def list_exclusions(provider: CurrentProvider) -> Any:
    """Areas the provider explicitly does not serve."""
    return ok(await _service().list_exclusions(str(provider["provider_id"])))


@router.post("/exclusions")
async def add_exclusion(
    payload: AddExclusionRequest, provider: CurrentProvider
) -> Any:
    """Declare an excluded area."""
    return ok(
        await _service().add_exclusion(
            str(provider["provider_id"]), payload.model_dump(exclude_unset=True)
        )
    )


@router.delete("/exclusions/{exclusion_id}")
async def remove_exclusion(exclusion_id: str, provider: CurrentProvider) -> Any:
    """Remove one exclusion."""
    return ok(
        await _service().remove_exclusion(
            str(provider["provider_id"]), exclusion_id
        )
    )


@router.get("")
async def list_areas(provider: CurrentProvider) -> Any:
    """All service-area entries of the provider."""
    return ok(await _service().list_areas(str(provider["provider_id"])))


@router.post("")
async def add_area(payload: AddAreaRequest, provider: CurrentProvider) -> Any:
    """Add one service-area entry."""
    return ok(
        await _service().add_area(
            str(provider["provider_id"]), payload.model_dump(exclude_unset=True)
        )
    )


@router.patch("/{area_id}")
async def update_area(
    area_id: str, payload: UpdateAreaRequest, provider: CurrentProvider
) -> Any:
    """Partially edit one area entry."""
    return ok(
        await _service().update_area(
            str(provider["provider_id"]),
            area_id,
            payload.model_dump(exclude_unset=True),
        )
    )


@router.delete("/{area_id}")
async def remove_area(area_id: str, provider: CurrentProvider) -> Any:
    """Delete one area entry."""
    return ok(await _service().remove_area(str(provider["provider_id"]), area_id))