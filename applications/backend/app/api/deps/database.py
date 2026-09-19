"""Database session dependency — scoped session per request."""
from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated, Any

from fastapi import Depends

from app.shared.exceptions.hierarchy import NotImplementedFeatureError


async def get_db_session() -> AsyncIterator[Any]:
    """Yield a PRIMARY_DB session bound to the request lifetime."""
    raise NotImplementedFeatureError("Database session dependency not implemented yet")
    yield  # pragma: no cover - keeps generator protocol shape


SessionDep = Annotated[Any, Depends(get_db_session)]
