"""SpendingPatternCalculator — Category concentration and recurring patterns."""
from __future__ import annotations

from typing import Any


class SpendingPatternCalculator:
    @staticmethod
    def calculate(rows: list[dict[str, Any]], **options: Any) -> dict[str, Any]:
        """Pure computation over governed-query rows (implement with feature)."""
        raise NotImplementedError("SpendingPatternCalculator.calculate")
