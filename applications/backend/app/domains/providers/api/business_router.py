"""Provider business profile routes — company details for company-operated accounts (Provider Req Phase 4)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/business", tags=["provider-business"])


class BusinessUpsertRequest(BaseModel):
    """Create or partially update — absent fields keep their current values."""

    business_name: str | None = Field(default=None, max_length=160)
    logo_url: str | None = Field(default=None, max_length=500)
    registration_number: str | None = Field(default=None, max_length=80)
    tax_number: str | None = Field(default=None, max_length=80)
    business_email: str | None = Field(default=None, max_length=180)
    business_phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=300)
    city: str | None = Field(default=None, max_length=80)
    region: str | None = Field(default=None, max_length=80)
    country: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, max_length=2000)
    year_established: int | None = None
    num_employees: int | None = None
    website: str | None = Field(default=None, max_length=300)
    social: dict[str, str] | None = None


def _service() -> Any:
    return get_composition().provider_business_service()


@router.get("")
async def get_business_profile(provider: CurrentProvider) -> Any:
    """The provider's own business profile (404 until created)."""
    return ok(await _service().get(str(provider["provider_id"])))


@router.put("")
async def upsert_business_profile(
    payload: BusinessUpsertRequest, provider: CurrentProvider
) -> Any:
    """Create the business profile (name required) or update the supplied fields."""
    data = payload.model_dump(exclude_unset=True)
    return ok(await _service().upsert(str(provider["provider_id"]), data))


@router.delete("")
async def delete_business_profile(provider: CurrentProvider) -> Any:
    """Remove the business profile (e.g. switching back to an individual account)."""
    return ok(await _service().delete(str(provider["provider_id"])))