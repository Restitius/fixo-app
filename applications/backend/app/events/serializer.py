"""Event serialization (pure) — dict/JSON round-trips for logs and queues."""
from __future__ import annotations

import json
from dataclasses import asdict, is_dataclass
from typing import Any

from app.events.event import DomainEvent, EventContext


def serialize(event: DomainEvent) -> dict[str, Any]:
    """Flatten an event (dataclasses -> dicts) for transport/logging."""
    payload = asdict(event) if is_dataclass(event) else dict(vars(event))
    return payload


def deserialize(data: dict[str, Any]) -> DomainEvent:
    """Rebuild a base DomainEvent from serialized form."""
    context = EventContext(**(data.get("context") or {}))
    return DomainEvent(
        name=data["name"],
        payload=data.get("payload") or {},
        event_id=data.get("event_id", ""),
        occurred_at=data.get("occurred_at", ""),
        context=context,
    )


def dumps(event: DomainEvent) -> str:
    return json.dumps(serialize(event), default=str)


def loads(raw: str) -> DomainEvent:
    return deserialize(json.loads(raw))
