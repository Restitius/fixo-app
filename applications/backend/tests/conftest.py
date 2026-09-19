"""Shared fixtures — ASGI test client over the real application."""
from __future__ import annotations

import httpx
import pytest

from app.main import app


@pytest.fixture
async def client():
    """Async client bound to the FastAPI app (no lifespan side effects)."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
