"""UserController — thin HTTP translation layer (section 35)."""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class UserController:
    """Converts requests to DTOs, calls the service, wraps resources."""

    @classmethod
    async def create(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("User create pipeline not implemented yet")

    @classmethod
    async def update(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("User update pipeline not implemented yet")
    @classmethod
    async def change_password(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("User change_password pipeline not implemented yet")
    @classmethod
    async def deactivate(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("User deactivate pipeline not implemented yet")
