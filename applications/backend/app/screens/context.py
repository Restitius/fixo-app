"""ScreenContext — per-request screen identity resolved from X-Screen-ID."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ScreenContext:
    screen_id: str
    name: str
    module: str
    route: str
    permission: str
