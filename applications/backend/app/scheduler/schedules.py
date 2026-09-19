"""Schedule descriptors — interval or cron expressions (pure builders)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Schedule:
    kind: str          # 'interval' | 'cron'
    expression: str    # seconds/minutes for interval; 5-field cron otherwise


def every_minutes(minutes: int) -> Schedule:
    if minutes <= 0:
        raise ValueError("minutes must be positive")
    return Schedule(kind="interval", expression=f"{minutes * 60}s")


def daily_at(hhmm: str) -> Schedule:
    """Cron for a fixed daily time, e.g. daily_at('00:10') -> '10 0 * * *'."""
    hh, mm = hhmm.split(":")
    hour, minute = int(hh), int(mm)
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError(f"Invalid time: {hhmm}")
    return Schedule(kind="cron", expression=f"{minute} {hour} * * *")


def next_run_after(schedule: Schedule, from_epoch: float) -> float:
    """Compute next fire time (cron parser wired in implementation phase)."""
    raise NotImplementedError("next_run_after — integrate cron parser")
