"""Registered matching strategies — data, not scattered conditionals.

Weights sum to 100. Each strategy tweaks the weights plus optional bonuses.
IDs follow MATCH.<NAME>.V1 so they can evolve independently.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class StrategyWeights:
    strategy_id: str
    rating: int          # rating_avg / 5 * weight
    jobs: int            # min(jobs_completed, 100) / 100 * weight
    proximity: int       # same city = full, same region = half, else 0
    bonuses: dict[str, int] = field(default_factory=dict)
    description: str = ""


STRATEGIES: dict[str, StrategyWeights] = {
    # MATCH.DEFAULT.V1 — balanced quality-first ranking.
    "MATCH.DEFAULT.V1": StrategyWeights(
        strategy_id="MATCH.DEFAULT.V1",
        rating=40, jobs=30, proximity=30,
        description="Balanced ranking for standard requests.",
    ),
    # MATCH.EMERGENCY.V1 — speed proxy: being in the same city dominates.
    "MATCH.EMERGENCY.V1": StrategyWeights(
        strategy_id="MATCH.EMERGENCY.V1",
        rating=25, jobs=15, proximity=60,
        description="Same-city providers dominate for urgent jobs.",
    ),
    # MATCH.REPEAT_PROVIDER.V1 — loyalty bonus for proven history.
    "MATCH.REPEAT_PROVIDER.V1": StrategyWeights(
        strategy_id="MATCH.REPEAT_PROVIDER.V1",
        rating=35, jobs=25, proximity=40,
        bonuses={"repeat_customer": 20},
        description="Prior accepted jobs with this customer rank first.",
    ),
}


def pick_strategy(*, urgent: bool, has_repeat_history: bool) -> str:
    """Business rule for automatic strategy selection."""
    if urgent:
        return "MATCH.EMERGENCY.V1"
    if has_repeat_history:
        return "MATCH.REPEAT_PROVIDER.V1"
    return "MATCH.DEFAULT.V1"