"""DomainEvent base + EventContext.

Convention: every domain event declares EVENT_NAME = 'EVT-<MODULE>-<ACTION>'
and carries only JSON-safe payload data. Services EMIT; listeners REACT.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.shared.helpers.datetime_utils import iso_utc
from app.shared.helpers.identifiers import new_event_id


@dataclass(frozen=True)
class EventContext:
    """Traceability snapshot attached to every event (section 11/22)."""

    request_id: str = ""
    correlation_id: str = ""
    user_id: str = ""
    session_id: str = ""
    screen_id: str = ""
    tenant_id: str = ""
    client_id: str = ""
    client_version: str = ""


@dataclass
class DomainEvent:
    """Base class for all domain events."""

    name: str
    payload: dict[str, Any] = field(default_factory=dict)
    event_id: str = field(default_factory=new_event_id)
    occurred_at: str = field(default_factory=iso_utc)
    context: EventContext = field(default_factory=EventContext)

    @classmethod
    def event_name(cls) -> str:
        return getattr(cls, "EVENT_NAME", cls.__name__)

    def to_dict(self) -> dict[str, Any]:
        from app.events.serializer import serialize  # local import avoids cycle

        return serialize(self)


def make_event(
    name: str,
    payload: dict[str, Any] | None = None,
    context: EventContext | None = None,
) -> DomainEvent:
    """Factory for ad-hoc events (typed subclasses preferred in domains)."""
    return DomainEvent(name=name, payload=payload or {}, context=context or EventContext())
