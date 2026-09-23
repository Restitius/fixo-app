"""Typed definition for one stable, client-facing system message."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class MessageDefinition:
    message_id: str
    severity: str
    presentation: str
    title: str
    body: str
    required_params: tuple[str, ...] = ()
    audiences: tuple[str, ...] = ("customer", "provider")
    action_id: str | None = None
    action_label: str | None = None

    def catalogue_entry(self) -> dict[str, Any]:
        """Return the safe client catalogue form without interpolating parameters."""
        return {
            "id": self.message_id,
            "type": self.severity,
            "presentation": self.presentation,
            "title": self.title,
            "body": self.body,
            "required_params": list(self.required_params),
            "audiences": list(self.audiences),
            "action": (
                {"id": self.action_id, "label": self.action_label}
                if self.action_id and self.action_label
                else None
            ),
        }

    def render(self, params: dict[str, Any] | None = None) -> dict[str, Any]:
        values = params or {}
        missing = [name for name in self.required_params if name not in values]
        if missing:
            raise ValueError(
                f"{self.message_id} is missing message parameters: {', '.join(missing)}"
            )
        return {
            "id": self.message_id,
            "type": self.severity,
            "presentation": self.presentation,
            "title": self.title.format(**values),
            "body": self.body.format(**values),
            "params": values,
            "action": (
                {"id": self.action_id, "label": self.action_label}
                if self.action_id and self.action_label
                else None
            ),
        }
