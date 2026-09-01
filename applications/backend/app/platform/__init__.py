"""Platform — the manager layer where adapters meet registries and infrastructure.

Direction of dependency (golden rule):

    Application Service --> PORT --> ADAPTER --> MANAGER --> REGISTRY --> INFRASTRUCTURE

Managers in this package are consumed by `app/adapters/`, never by domain or
application services. They orchestrate registries, enforce policy (validation,
security, transactions, timeouts, metrics, audit) and translate business
operations into governed executions.

    app/platform/
    |-- query/          SQLQueryManager (the governance boundary for SQL)
    |-- integrations/   integration / provider resolution
    |-- events/         event dispatch
    |-- notifications/  notification lifecycle + channels
    |-- screens/        screen registry resolution
    |-- audit/          audit recording
    |-- commands/       command bus
    |-- workflow/       state machines
    |-- pricing/        pricing engine
    |-- permissions/    authorization
    |-- files/ search/ cache/ jobs/ scheduler/
    '-- registry/       RegistryManager facade
"""
from app.platform.commands import CommandManager
from app.platform.registry import RegistryManager

__all__ = ["CommandManager", "RegistryManager"]