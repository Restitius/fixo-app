"""System endpoints — health, readiness, runtime info (platform-owned)."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.observability.health import HealthReporter
from app.shared.responses.envelope import error_envelope, success_envelope

router = APIRouter(tags=["system"])

_health_reporter = HealthReporter()


def get_health_reporter() -> HealthReporter:
    """Process-wide readiness checker registry (mirrors composition.py's
    get/set-singleton convention). app/startup/application.py registers
    real component checkers here once they exist (e.g. databases), after
    Bootstrap.run_startup() completes."""
    return _health_reporter


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
async def readiness() -> JSONResponse:
    """Readiness probe — verifies registered dependencies (currently:
    database engines; see app/startup/application.py for what's wired).
    Redis and the scheduler are not yet checked here: REDIS_URL is declared
    in config but no Redis client is constructed anywhere in the app today
    (confirmed — grepped for consumers, found none), and the scheduler has
    no health-reportable state of its own. Checking them would fabricate a
    signal this app doesn't actually have; documented here rather than
    silently faked."""
    checks = await _health_reporter.readiness()
    ready = bool(checks) and all(check.status == "up" for check in checks)
    payload = {
        "status": "up" if ready else "down",
        "components": [
            {"component": c.component, "status": c.status, "detail": c.detail}
            for c in checks
        ],
    }
    if ready:
        return JSONResponse(
            status_code=200,
            content=success_envelope(data=payload, title="Ready", body="All dependencies reachable."),
        )
    return JSONResponse(
        status_code=503,
        content=error_envelope(
            code="SYSTEM.NOT_READY",
            title="Not Ready",
            body="One or more dependencies are unreachable.",
            details=payload,
        ),
    )


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
