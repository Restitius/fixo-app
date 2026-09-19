"""OtpRepository — persistence port for OTP issue/verify (DB functions behind)."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class OtpRepository(Protocol):
    async def issue(self, user_id: str, params: dict[str, Any]) -> Any | None: ...
    async def verify(self, user_id: str, params: dict[str, Any]) -> bool: ...