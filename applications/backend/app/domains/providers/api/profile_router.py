"""Provider profile routes — curate + preview the public profile (Provider Req Phase 3)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/profile", tags=["provider-profile"])


class ProfileUpdateRequest(BaseModel):
    """All fields optional — only supplied fields are updated."""

    profile_photo_url: str | None = Field(default=None, max_length=500)
    gender: str | None = Field(default=None, max_length=20)
    date_of_birth: str | None = Field(default=None, description="ISO date YYYY-MM-DD")
    bio: str | None = Field(default=None, max_length=1000)
    languages: str | None = Field(default=None, max_length=200)
    professional_title: str | None = Field(default=None, max_length=200)
    years_experience: int | None = Field(default=None, ge=0, le=60)
    qualifications: list[str] | None = None
    certifications: list[str] | None = None
    skills: list[str] | None = None
    specializations: list[str] | None = None
    tools: list[str] | None = None


def _service() -> Any:
    return get_composition().provider_profile_service()


@router.get("")
async def get_profile(provider: CurrentProvider) -> Any:
    """Provider's own full profile (personal + professional)."""
    return ok(await _service().get_profile(str(provider["provider_id"])))


@router.patch("")
async def update_profile(payload: ProfileUpdateRequest, provider: CurrentProvider) -> Any:
    """Curate profile fields; absent fields keep their current values."""
    data = payload.model_dump(exclude_unset=True)
    return ok(await _service().update_profile(str(provider["provider_id"]), data))


@router.get(
    "/preview",
    status_code=status.HTTP_200_OK,
    summary="Preview the profile exactly as customers will see it",
)
async def preview_public_profile(provider: CurrentProvider) -> Any:
    return ok(await _service().public_preview(str(provider["provider_id"])))
