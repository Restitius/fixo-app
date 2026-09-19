"""LiabilityController — thin HTTP translation layer (section 35)."""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class LiabilityController:
    """Converts requests to DTOs, calls the service, wraps resources."""

    @classmethod
    async def create(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Liability create pipeline not implemented yet")

    @classmethod
    async def update(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Liability update pipeline not implemented yet")
    @classmethod
    async def restructure(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Liability restructure pipeline not implemented yet")
    @classmethod
    async def record_payment(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Liability record_payment pipeline not implemented yet")
