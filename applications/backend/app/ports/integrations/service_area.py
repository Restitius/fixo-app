"""ServiceAreaPort — is a location inside our served area?

Cross-domain capability consumed by the eligibility engine; implemented by
an adapter over the governed SERVICE_AREAS query.
"""
from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class ServiceAreaPort(Protocol):
    async def is_served(self, *, city: str | None, region: str | None) -> bool: ...