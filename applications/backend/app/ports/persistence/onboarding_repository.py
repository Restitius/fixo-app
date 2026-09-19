"""OnboardingRepository — onboarding step catalogue + progress port."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class OnboardingRepository(Protocol):
    async def steps(self) -> list[dict[str, Any]]: ...
    async def status(self, user_id: str) -> list[dict[str, Any]]: ...
    async def complete_step(self, user_id: str, step_code: str) -> Any | None: ...