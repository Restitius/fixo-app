"""Users API dependencies — composed Depends objects."""
from __future__ import annotations

from app.api.deps.request_context import GetRequestContext

# TODO(security): compose PrincipalDep + require_permissions("users.view").

CtxDep = GetRequestContext
