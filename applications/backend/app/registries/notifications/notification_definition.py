"""NotificationDefinition — one catalogue entry (NTF-* key).

Populated from the per-domain declarative modules under
domains/*/notifications/*_notification.py and registered by
app/startup/register_notifications.py.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class NotificationDefinition:
    key: str
    category: str
    recipients: tuple[str, ...]
    channels: dict[str, tuple[str, ...]] = field(default_factory=dict)
    required_data: tuple[str, ...] = ()
    # English fallback used only when no locale resource has this key (keeps
    # the 12 pre-existing domains/*/notifications/*.py definitions — which
    # predate the locale-resource system — deliverable without edits).
    title_template: str | None = None
    body_template: str | None = None

    def channels_for(self, recipient_type: str) -> tuple[str, ...]:
        return self.channels.get(recipient_type, ("database",))
