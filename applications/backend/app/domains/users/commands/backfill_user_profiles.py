"""CLI command: Create missing profile rows for legacy users."""
from __future__ import annotations

COMMAND_NAME = "domains.backfill_user_profiles"


def run(args=None) -> int:
    raise NotImplementedError("BackfillUserProfiles.run")
