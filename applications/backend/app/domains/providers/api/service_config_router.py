"""Provider service configuration routes — per-service setup + approval gate (Provider Req Phase 6).

Provider-owned endpoints only. The platform-side review decision exists as a
service method and is exposed with the platform admin module behind an admin
guard (same pattern as provider verification).
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/services", tags=["provider-services"])


class ServiceConfigRequest(BaseModel):
    """Full-replace configuration for one catalogue service."""

    display_name: str | None = Field(default=None, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    years_experience: int | None = Field(default=None, ge=0, le=60)
    pricing_model: str = Field(max_length=20)
    minimum_charge: float | None = Field(default=None, ge=0)
    duration_minutes: int | None = Field(default=None, gt=0, le=1440)
    is_emergency_available: bool = False
    tools: list[str] | None = None
    materials: list[str] | None = None
    warranty: dict[str, Any] | None = None
    photos: list[str] | None = None


def _service() -> Any:
    return get_composition().provider_service_config_service()


@router.get("/catalog")
async def service_catalog(provider: CurrentProvider) -> Any:
    """Active catalogue services available for configuration."""
    return ok(await _service().catalog())


@router.get("")
async def my_services(provider: CurrentProvider) -> Any:
    """The provider's configured services (all non-archived lifecycle states)."""
    return ok(await _service().configs(str(provider["provider_id"])))


@router.get("/{service_id}")
async def my_service(service_id: str, provider: CurrentProvider) -> Any:
    """One configured service."""
    return ok(await _service().config(str(provider["provider_id"]), service_id))


@router.put("/{service_id}")
async def configure_service(
    service_id: str, payload: ServiceConfigRequest, provider: CurrentProvider
) -> Any:
    """Create/replace the configuration for one service (resets approval to DRAFT)."""
    return ok(
        await _service().upsert(
            str(provider["provider_id"]), service_id, payload.model_dump(exclude_unset=True)
        )
    )


@router.delete("/{service_id}")
async def remove_service(service_id: str, provider: CurrentProvider) -> Any:
    """Archive the configuration (soft delete; historical references preserved)."""
    return ok(await _service().archive(str(provider["provider_id"]), service_id))


@router.post("/{service_id}/submit")
async def submit_for_approval(service_id: str, provider: CurrentProvider) -> Any:
    """Submit the configuration for platform approval (DRAFT/REJECTED -> PENDING_APPROVAL)."""
    return ok(await _service().submit(str(provider["provider_id"]), service_id))
