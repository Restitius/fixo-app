"""DeadLetterQueue — parking failed jobs for inspection and replay."""
from __future__ import annotations

from typing import Any


class DeadLetterQueue:
    async def push(self, job_id: str, payload: dict, error: str) -> str:
        """Persist a failed job attempt; return dead-letter entry id."""
        raise NotImplementedError("DeadLetterQueue.push")

    async def list_entries(self, limit: int = 50) -> list[dict[str, Any]]:
        raise NotImplementedError("DeadLetterQueue.list_entries")

    async def replay(self, entry_id: str) -> str:
        """Re-enqueue a dead-lettered job; returns new job_run_id."""
        raise NotImplementedError("DeadLetterQueue.replay")
