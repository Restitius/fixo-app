"""CLI command: Force-sign-out every session (incident response)."""
from __future__ import annotations

COMMAND_NAME = "domains.revoke_all_sessions"


def run(args=None) -> int:
    raise NotImplementedError("RevokeAllSessions.run")
