"""AuthenticationController — thin HTTP translation layer (section 35)."""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class AuthenticationController:
    """Converts requests to DTOs, calls the service, wraps resources."""

    @classmethod
    async def login(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Authentication login pipeline not implemented yet")

    @classmethod
    async def refresh(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Authentication refresh pipeline not implemented yet")
    @classmethod
    async def logout(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Authentication logout pipeline not implemented yet")
    @classmethod
    async def list_sessions(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Authentication list_sessions pipeline not implemented yet")
