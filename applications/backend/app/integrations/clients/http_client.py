"""HttpClient — shared async HTTP boundary for all provider adapters."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any


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
        """Perform one HTTP call (httpx.AsyncClient in implementation phase)."""
        raise NotImplementedError("HttpClient.request")
