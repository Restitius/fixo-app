"""TransactionController — thin HTTP translation layer (section 35)."""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class TransactionController:
    """Converts requests to DTOs, calls the service, wraps resources."""

    @classmethod
    async def create(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Transaction create pipeline not implemented yet")

    @classmethod
    async def update(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Transaction update pipeline not implemented yet")
    @classmethod
    async def settle(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Transaction settle pipeline not implemented yet")
    @classmethod
    async def categorize(cls, ctx: Any, *args: Any, **kwargs: Any) -> dict:
        raise NotImplementedFeatureError("Transaction categorize pipeline not implemented yet")
