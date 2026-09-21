"""AssetTotals — aggregate portfolio math over summary rows (pure)."""
from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from typing import Any


def totals_by_currency(summary_rows: list[dict[str, Any]]) -> dict[str, dict[str, Decimal]]:
    """Sum purchase/current values grouped by currency."""
    totals: dict[str, dict[str, Decimal]] = defaultdict(lambda: {"purchase": Decimal(0), "current": Decimal(0), "count": Decimal(0)})
    for row in summary_rows:
        bucket = totals[row.get("currency", "USD")]
        bucket["purchase"] += Decimal(str(row.get("total_purchase_value", 0)))
        bucket["current"] += Decimal(str(row.get("total_current_value", 0)))
        bucket["count"] += Decimal(str(row.get("asset_count", 0)))
    return dict(totals)


def net_position(totals: dict[str, dict[str, Decimal]]) -> dict[str, Decimal]:
    """Current minus purchase per currency (unrealized gain/loss)."""
    return {cur: vals["current"] - vals["purchase"] for cur, vals in totals.items()}
