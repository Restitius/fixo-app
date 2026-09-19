"""CLI command: Rebuild amortization schedules for active liabilities."""
from __future__ import annotations

COMMAND_NAME = "domains.recalculate_schedules"


def run(args=None) -> int:
    raise NotImplementedError("RecalculateSchedules.run")
