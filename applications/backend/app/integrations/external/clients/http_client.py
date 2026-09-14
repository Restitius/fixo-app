"""HttpClient - shared async HTTP boundary for all provider adapters."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

import httpx


@dataclass
class HttpResponse:
    status: int
    headers: dict[str, str] = field(default_factory=dict)
    body: bytes = b""

    def json(self) -> Any:
        """Parse body as JSON (raises ValueError on malformed payloads)."""
        return json.loads(self.body.decode("utf-8")) if self.body else None


class HttpClient:
    """Single place where timeouts/headers/user-agent are standardized."""

    def __init__(
        self,
        base_url: str = "",
        *,
        timeout_seconds: float = 10.0,
        default_headers: dict[str, str] | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.default_headers = default_headers or {}

    async def request(
        self,
        method: str,
        path: str,
        *,
        json_payload: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> HttpResponse:
        """Perform one HTTP call using httpx.AsyncClient."""
        url = f"{self.base_url}{path}" if self.base_url else path
        request_headers = {**self.default_headers, **(headers or {})}
        if json_payload is not None and "content-type" not in {k.lower() for k in request_headers}:
            request_headers.setdefault("content-type", "application/json")
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.request(
                method,
                url,
                json=json_payload,
                params=params,
                headers=request_headers,
            )
        return HttpResponse(
            status=response.status_code,
            headers=dict(response.headers),
            body=response.content,
        )
