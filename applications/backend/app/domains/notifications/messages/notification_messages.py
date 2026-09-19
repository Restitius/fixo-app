"""NotificationMessages — user-facing copy catalog."""
from __future__ import annotations

MESSAGES: dict[str, dict[str, str]] = {
    "marked_read": {"title": "Marked as read", "body": "The notification was marked as read."},
    "dismissed": {"title": "Dismissed", "body": "The notification was dismissed."},
    "preferences_saved": {"title": "Preferences saved", "body": "Your notification preferences were updated."},
    "listed": {"title": "Notifications loaded", "body": "Your inbox is ready."},
    "escalated": {"title": "Escalated", "body": "An unread critical alert was escalated."},
}


def get(action: str) -> dict[str, str]:
    return MESSAGES.get(action, {"title": "Success", "body": ""})
