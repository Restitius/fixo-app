"""RetryHttpClient — wraps HttpClient with RetryPolicy-driven attempts."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.integrations.clients.http_client import HttpClient, HttpResponse
from app.jobs.retry import RetryPolicy, compute_backoff, should_retry
from app.shared.exceptions.hierarchy import ExternalTimeoutError, IntegrationError

logger = logging.getLogger(__name__)


class RetryHttpClient(HttpClient):
    """Retries transient failures (timeouts/5xx) with exponential backoff."""

    def __init__(self, *args: Any, retry_policy: RetryPolicy | None = None, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.retry_policy = retry_policy or RetryPolicy(max_attempts=3)

    async def request(
        self,
        method: str,
        path: str,
        *,
        json_payload: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> HttpResponse:
        attempt = 0
        while True:
            attempt += 1
            try:
                response = await self.perform_request(
                    method, path, json_payload=json_payload, params=params, headers=headers
                )
                if response.status >= 500 and should_retry(attempt, self.retry_policy):
                    raise IntegrationError(f"Upstream 5xx: {response.status}")
                return response
            except NotImplementedError:
                raise  # scaffold boundary propagates untouched
            except Exception as exc:  # noqa: BLE001
                if not should_retry(attempt, self.retry_policy):
                    if isinstance(exc, (ExternalTimeoutError, IntegrationError)):
                        raise
                    raise IntegrationError(f"Integration call failed: {exc}") from exc
                delay = compute_backoff(attempt, self.retry_policy)
                logger.warning("retry %s %s in %.2fs (attempt %s)", method, path, delay, attempt)
                await asyncio.sleep(delay)

    async def perform_request(
        self,
        method: str,
        path: str,
        *,
        json_payload: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> HttpResponse:
        """One raw attempt (transport wired in implementation phase)."""
        raise NotImplementedError("RetryHttpClient.perform_request")
