"""AuthenticationMessages — user-facing copy catalog."""
from __future__ import annotations

MESSAGES: dict[str, dict[str, str]] = {
    "login_ok": {"title": "Signed in", "body": "Welcome back."},
    "login_failed": {"title": "Sign-in failed", "body": "Invalid credentials."},
    "logged_out": {"title": "Signed out", "body": "Your session has ended."},
    "refreshed": {"title": "Session renewed", "body": "Your access token was renewed."},
    "sessions_listed": {"title": "Sessions loaded", "body": "Active sessions retrieved."},
}


def get(action: str) -> dict[str, str]:
    return MESSAGES.get(action, {"title": "Success", "body": ""})
