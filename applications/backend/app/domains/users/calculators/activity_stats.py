"""ActivityStatsCalculator — Login/edit frequency summaries (pure over rows)."""
from __future__ import annotations

from typing import Any


class ActivityStatsCalculator:
    @staticmethod
    def calculate(rows: list[dict[str, Any]], **options: Any) -> dict[str, Any]:
        """Pure computation over governed-query rows (implement with feature)."""
        raise NotImplementedError("ActivityStatsCalculator.calculate")
