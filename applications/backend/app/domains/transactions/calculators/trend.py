"""TrendCalculator — Period-over-period direction of totals (pure once fed rows)."""
from __future__ import annotations

from typing import Any


class TrendCalculator:
    @staticmethod
    def calculate(rows: list[dict[str, Any]], **options: Any) -> dict[str, Any]:
        """Pure computation over governed-query rows (implement with feature)."""
        raise NotImplementedError("TrendCalculator.calculate")
