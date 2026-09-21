"""TenantContext + resolution (multi-tenancy ready)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class TenantContext:
    tenant_id: str
    schema_name: str | None = None


class TenantResolver:
    """Resolves tenancy from headers/token claims per request."""

    async def resolve(self, request: Any) -> TenantContext | None:
        raise NotImplementedError("TenantResolver.resolve")
