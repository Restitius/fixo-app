"""InterestCalculator — Simple/compound interest helpers (pure math)."""
from __future__ import annotations

from typing import Any


class InterestCalculator:
    @staticmethod
    def calculate(rows: list[dict[str, Any]], **options: Any) -> dict[str, Any]:
        """Pure computation over governed-query rows (implement with feature)."""
        raise NotImplementedError("InterestCalculator.calculate")
