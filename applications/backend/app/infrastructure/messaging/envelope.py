"""Versioned transport envelope shared by Kafka events and RabbitMQ commands."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from app.shared.helpers.datetime_utils import iso_utc
from app.shared.helpers.identifiers import new_event_id


@dataclass(frozen=True)
class MessageEnvelope:
    message_type: str
    payload: dict[str, Any]
    message_id: str = field(default_factory=new_event_id)
    schema_version: int = 1
    occurred_at: str = field(default_factory=iso_utc)
    correlation_id: str = ""
    causation_id: str = ""
    producer: str = "fixo-api"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
