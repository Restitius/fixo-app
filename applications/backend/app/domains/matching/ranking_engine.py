"""RankingEngine — pure scoring math for match candidates.

Takes a candidate row (from MatchingRepository.search_candidates) plus a
registered StrategyWeights; produces score 0-100 with human-readable reasons.
No I/O of any kind.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.domains.matching.strategies import StrategyWeights


@dataclass
class ScoredCandidate:
    provider_id: str
    strategy_id: str
    score: float
    reasons: str


class RankingEngine:
    @staticmethod
    def score(candidate: dict[str, Any], weights: StrategyWeights,
              *, request_city: str | None) -> ScoredCandidate:
        rating = float(candidate.get("rating_avg") or 0)
        jobs = int(candidate.get("jobs_completed") or 0)

        parts: list[str] = []
        score = 0.0

        s_rating = round(rating / 5.0 * weights.rating, 2)
        score += s_rating
        parts.append(f"rating {rating} (+{s_rating})")

        s_jobs = round(min(jobs, 100) / 100.0 * weights.jobs, 2)
        score += s_jobs
        parts.append(f"{jobs} jobs (+{s_jobs})")

        city = (candidate.get("city") or "").lower()
        region = (candidate.get("region") or "").lower()
        req_city = (request_city or "").lower()
        if req_city and city == req_city:
            prox = float(weights.proximity)
            parts.append("same city")
        elif region and request_city is not None:
            prox = round(weights.proximity / 2.0, 2)
            parts.append("same region")
        else:
            prox = 0.0
        score += prox

        if candidate.get("repeat_customer") and "repeat_customer" in weights.bonuses:
            bonus = float(weights.bonuses["repeat_customer"])
            score += bonus
            parts.append("worked for you before")

        return ScoredCandidate(
            provider_id=str(candidate["provider_id"]),
            strategy_id=weights.strategy_id,
            score=min(round(score, 2), 100.0),
            reasons="; ".join(parts)[:500],
        )