"""IntegrationDefinition — governance record for an external provider binding.

Flow position (§8):

    Service --> IntegrationManager --(integration_id)--> IntegrationRegistry
            --> IntegrationDefinition --> Provider Adapter --> HTTP Client
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class CircuitBreakerPolicy:
    """Failure thresholds before the integration is temporarily disabled."""

    failure_threshold: int = 5
    reset_timeout_seconds: int = 30


@dataclass(frozen=True)
class IntegrationDefinition:
    """Immutable description of one external integration.

    Attributes:
        integration_id:  Stable ID, e.g. 'INT-PAY-001'.
        provider:        Provider key, e.g. 'stripe', 'mpesa', 'smtp'.
        category:        payments | banks | mobile_money | email | sms | storage | analytics | external_apis
        credentials_key: Env-var prefix that holds this integration's secrets.
        base_url_env:    Optional env-var name carrying the provider base URL.
    """

    integration_id: str
    provider: str
    category: str
    credentials_key: str
    base_url_env: str = ""
    timeout_seconds: float = 10.0
    max_retries: int = 2
    circuit_breaker: CircuitBreakerPolicy = field(default_factory=CircuitBreakerPolicy)
    enabled: bool = True
    environment: str = "production"  # production | sandbox
    description: str = ""
