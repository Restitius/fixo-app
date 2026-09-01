"""System endpoints — health, readiness, runtime info (platform-owned)."""
from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.observability.health import HealthReporter
from app.shared.exceptions.hierarchy import NotImplementedFeatureError
from app.shared.responses.envelope import success_envelope

router = APIRouter(tags=["system"])

_health_reporter = HealthReporter()


@router.get("/health")
async def health() -> dict:
    """Liveness probe — cheap, always truthful about process state."""
    check = await _health_reporter.liveness()
    return success_envelope(
        data={"status": check.status, "component": check.component},
        title="Healthy",
        body="Service is alive.",
    )


@router.get("/health/ready")
async def readiness() -> dict:
    """Readiness probe — verifies database/cache/integrations."""
    raise NotImplementedFeatureError("Readiness checks not implemented yet")


@router.get("/info")
async def info() -> dict:
    """Runtime information: identity, environment, registry summary."""
    settings = get_settings()
    return success_envelope(
        data={
            "app": settings.app_name,
            "environment": settings.environment,
            "version": "0.1.0",
            "registries": {},
        },
        title="FIXO-APP",
        body="Runtime information.",
    )
