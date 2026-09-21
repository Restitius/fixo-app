"""UserMessages — user-facing copy catalog."""
from __future__ import annotations

MESSAGES: dict[str, dict[str, str]] = {
    "created": {"title": "Welcome aboard", "body": "Your account has been created."},
    "updated": {"title": "Profile updated", "body": "Your profile changes were saved."},
    "deactivated": {"title": "Account deactivated", "body": "Your account has been deactivated."},
    "password_changed": {"title": "Password changed", "body": "Your password was changed successfully."},
    "listed": {"title": "Users loaded", "body": "User directory is ready."},
}


def get(action: str) -> dict[str, str]:
    return MESSAGES.get(action, {"title": "Success", "body": ""})
