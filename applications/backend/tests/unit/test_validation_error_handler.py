"""A custom field validator raising ValueError must yield a 422, not a 500."""
from __future__ import annotations

import httpx
from fastapi import FastAPI
from pydantic import BaseModel, field_validator

from app.api.exceptions.handlers import register_exception_handlers


class _Payload(BaseModel):
    kind: str

    @field_validator("kind")
    @classmethod
    def _kind(cls, value: str) -> str:
        if value != "ok":
            raise ValueError("kind must be ok")
        return value


async def test_value_error_in_validator_returns_422_envelope():
    app = FastAPI()
    register_exception_handlers(app)

    @app.post("/x")
    async def _x(payload: _Payload) -> dict:
        return {"ok": True}

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://t") as client:
        response = await client.post("/x", json={"kind": "nope"})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION.FAILED"
    assert "kind must be ok" in str(body["error"]["details"]["errors"])
