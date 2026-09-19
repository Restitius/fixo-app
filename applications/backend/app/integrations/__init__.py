"""Integrations — split into two sibling concerns:

    app/integrations/external/   Third-party providers (SMS, email, payments,
                                  maps, storage): manager, contracts, providers,
                                  clients, adapters, transformers, webhooks, health.
    app/integrations/internal/   The cross-domain command bus: domains call
                                  each other through ports + this, never by
                                  touching another domain's database directly.
"""
