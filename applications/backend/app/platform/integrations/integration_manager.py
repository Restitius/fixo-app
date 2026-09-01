"""IntegrationManager — platform facade over the integration registry pipeline.

Adapters call this with a registered INT-* ID; the manager resolves the
definition, applies enabled/retry/breaker/health policy, and dispatches to the
provider adapter. Domain/application services should depend instead on the
business ports in `app/ports/integrations/`.
"""
from __future__ import annotations

from typing import Any

from app.integrations.manager import IntegrationManager as _IntegrationManager


class IntegrationManager(_IntegrationManager):
    """Platform facade over the existing integration manager (stable ID surface)."""

    async def execute(self, integration_id: str, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Resolve + policy-check + execute; scaffold until adapters land."""
        return await super().execute(integration_id, operation, payload)