"""ProviderAdapter — translates contract payloads to/from provider formats."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderAdapter(ABC):
    """One adapter per concrete provider (stripe, mpesa, smtp, twilio, ...)."""

    provider_name: str = ""

    def transform_request(self, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Default: pass-through; override per provider quirks."""
        return payload

    def transform_response(self, operation: str, response: dict[str, Any]) -> dict[str, Any]:
        """Default: pass-through; normalize provider envelopes here."""
        return response

    @abstractmethod
    async def execute(self, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Call the provider through the shared HTTP client."""
