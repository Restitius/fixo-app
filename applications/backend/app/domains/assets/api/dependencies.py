"""Assets API dependencies — composed Depends objects for router reuse."""
from __future__ import annotations

from app.api.deps.pagination import PaginationDep
from app.api.deps.request_context import GetRequestContext

# TODO(security): compose PrincipalDep + require_permissions("assets.view")
# into CtxWithPermission once authentication lands. Example shape:
#
#   AssetsViewDeps = Annotated[
#       tuple[RequestContext, Principal],
#       Depends(compose(GetRequestContext, require_permissions("assets.view"))),
#   ]

CtxDep = GetRequestContext
PageDep = PaginationDep
