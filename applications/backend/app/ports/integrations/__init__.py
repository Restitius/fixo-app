"""External-system ports — business-facing integration capabilities.

Domains depend on the specific gateway protocols here (e.g. a payment gateway
knows `authorize/capture/refund`), NEVER on provider names, registry IDs, or
the IntegrationManager. Adapters under `app/adapters/integrations/` translate
these operations into `IntegrationManager.execute(INT-*, ...)` calls.
"""