"""DebtToIncomeCalculator — DTI ratio from liabilities vs income (pure)."""
from __future__ import annotations

from typing import Any


class DebtToIncomeCalculator:
    @staticmethod
    def calculate(rows: list[dict[str, Any]], **options: Any) -> dict[str, Any]:
        """Pure computation over governed-query rows (implement with feature)."""
        raise NotImplementedError("DebtToIncomeCalculator.calculate")
