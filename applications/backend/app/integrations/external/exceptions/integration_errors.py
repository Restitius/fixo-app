"""Integration-specific exception refinements."""
from __future__ import annotations

from app.shared.exceptions.hierarchy import ConfigurationError, IntegrationError


class WebhookSignatureError(IntegrationError):
    """Webhook signature verification failed (HTTP 400)."""

    default_code = "INTEGRATION.WEBHOOK_SIGNATURE"
    http_status = 400


class ProviderRejectedError(IntegrationError):
    """External provider explicitly rejected the request."""

    default_code = "INTEGRATION.PROVIDER_REJECTED"
    http_status = 502


class ProviderRateLimitedError(IntegrationError):
    """External provider throttled us."""

    default_code = "INTEGRATION.PROVIDER_RATE_LIMITED"
    http_status = 429


class CredentialsMissingError(ConfigurationError):
    """Required provider credentials absent from environment."""

    default_code = "INTEGRATION.CREDENTIALS_MISSING"
    http_status = 500
