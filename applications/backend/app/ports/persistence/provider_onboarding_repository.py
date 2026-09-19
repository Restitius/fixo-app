"""ProviderOnboardingRepository — provider onboarding steps + progress port."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderOnboardingRepository(Protocol):
    async def steps(self) -> list[dict[str, Any]]: ...
    async def status(self, provider_id: str) -> list[dict[str, Any]]: ...
    async def save_step(
        self, provider_id: str, step_code: str, data: dict[str, Any]
    ) -> Any | None: ...
    async def complete_step(
        self, provider_id: str, step_code: str, data: dict[str, Any]
    ) -> Any | None: ...
