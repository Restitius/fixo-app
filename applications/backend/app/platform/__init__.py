"""Platform — the manager layer where adapters meet registries and infrastructure.

Direction of dependency (golden rule):

    Application Service --> PORT --> ADAPTER --> MANAGER --> REGISTRY --> INFRASTRUCTURE

Managers in this package are consumed by `app/adapters/`, never by domain or
application services. They orchestrate registries, enforce policy (validation,
security, transactions, timeouts, metrics, audit) and translate business
operations into governed executions.

    app/platform/
    |-- query/          SQLQueryManager (the governance boundary for SQL)
    |-- integrations/   thin facade over app/integrations/external/ (provider resolution)
    |-- events/         event dispatch
    |-- notifications/  notification lifecycle + channels
    |-- screens/        screen registry resolution
    |-- audit/          audit recording
    |-- workflow/       state machines
    |-- pricing/        pricing engine
    |-- permissions/    authorization
    |-- files/ search/ cache/ jobs/ scheduler/
    '-- registry/       RegistryManager facade

The command bus (CommandManager/CommandRegistry) — internal integrations,
i.e. cross-domain calls — now lives at app/integrations/internal/,
alongside app/integrations/external/ (third-party providers), rather
than nested under this package.
"""
from app.integrations.internal import CommandManager
from app.platform.registry import RegistryManager

__all__ = ["CommandManager", "RegistryManager"]