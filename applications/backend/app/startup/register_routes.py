"""Route registration — includes every domain router into the v1 aggregate."""
from __future__ import annotations

from fastapi import FastAPI


def include_domain_routers(application: FastAPI) -> None:
    """Attach domain routers (called implicitly via api.v1.router)."""
    from app.api.v1.router import api_v1_router

    from app.config import get_settings

    application.include_router(api_v1_router, prefix=get_settings().api_v1_prefix)
