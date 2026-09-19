"""Tenant dependency — resolve tenancy from headers/claims."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header

from app.security.tenant import TenantContext


async def get_tenant_context(
    x_tenant_id: Annotated[str | None, Header()] = None,
) -> TenantContext | None:
    """Build TenantContext from the X-Tenant-ID header when present."""
    if not x_tenant_id:
        return None
    return TenantContext(tenant_id=x_tenant_id)


TenantDep = Annotated[TenantContext | None, Depends(get_tenant_context)]
