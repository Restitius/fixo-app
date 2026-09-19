"""LockoutMetricsCalculator — Failure-rate windows feeding lockout decisions (pure)."""
from __future__ import annotations

from typing import Any


class LockoutMetricsCalculator:
    @staticmethod
    def calculate(rows: list[dict[str, Any]], **options: Any) -> dict[str, Any]:
        """Pure computation over governed-query rows (implement with feature)."""
        raise NotImplementedError("LockoutMetricsCalculator.calculate")
