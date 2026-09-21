"""Database health probes surfaced through observability."""
from __future__ import annotations

from typing import Any


class DatabaseHealth:
    """Runs cheap validation queries per logical database."""

    def __init__(self, manager: Any) -> None:
        self._manager = manager

    async def check(self, database_id: str) -> dict[str, Any]:
        """Return {'component': db_id, 'status': up|down, 'detail': str}."""
        raise NotImplementedError("DatabaseHealth.check")

    async def check_all(self) -> list[dict[str, Any]]:
        raise NotImplementedError("DatabaseHealth.check_all")
