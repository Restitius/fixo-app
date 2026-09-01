"""Integration registration — seed known integration definitions.

Concrete credentials/providers activate as adapters are implemented;
definitions here establish the stable IDs (INT-*) domains will reference.
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def register_integrations(integration_registry: Any) -> None:
    """Register baseline integration definitions (scaffold set).

    Both the legacy hyphenated IDs and the dotted, versioned INT-* IDs that the
    adapters reference are seeded so the registry stays self-consistent as the
    platform/ adapter layers come online.
    """
    from app.registries.integrations.integration_definition import IntegrationDefinition

    seeds = [
        IntegrationDefinition(
            integration_id="INT-PAY-001",
            provider="placeholder",
            category="payments",
            credentials_key="PAYMENT_PRIMARY",
            description="Primary payment gateway (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT.PAYMENT.MOBILE_MONEY.V1",
            provider="mobile_money",
            category="payments",
            credentials_key="PAYMENT_PRIMARY",
            enabled=False,
            description="Mobile-money payment provider (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT.PAYMENT.CARD.V1",
            provider="card",
            category="payments",
            credentials_key="CARD_PRIMARY",
            enabled=False,
            description="Card payment provider (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT-EMAIL-001",
            provider="smtp",
            category="email",
            credentials_key="EMAIL_PRIMARY",
            description="Transactional email (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT.EMAIL.TRANSACTIONAL.V1",
            provider="smtp",
            category="email",
            credentials_key="EMAIL_PRIMARY",
            enabled=False,
            description="Transactional email (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT-SMS-001",
            provider="placeholder",
            category="sms",
            credentials_key="SMS_PRIMARY",
            description="SMS delivery (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT.SMS.TRANSACTIONAL.V1",
            provider="sms",
            category="sms",
            credentials_key="SMS_PRIMARY",
            enabled=False,
            description="Transactional SMS (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT.MAPS.GEOCODE.V1",
            provider="maps",
            category="maps",
            credentials_key="MAPS_PRIMARY",
            enabled=False,
            description="Geocoding provider (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT.MAPS.ROUTING.V1",
            provider="maps",
            category="maps",
            credentials_key="MAPS_PRIMARY",
            enabled=False,
            description="Routing provider (adapter pending).",
        ),
        IntegrationDefinition(
            integration_id="INT.STORAGE.OBJECTS.V1",
            provider="storage",
            category="storage",
            credentials_key="STORAGE_PRIMARY",
            enabled=False,
            description="Object storage provider (adapter pending).",
        ),
    ]
    for definition in seeds:
        integration_registry.register(definition)
    logger.info("integration registry seeded: %s", integration_registry.all_ids())
