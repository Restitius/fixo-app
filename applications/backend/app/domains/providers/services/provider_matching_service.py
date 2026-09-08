"""ProviderMatchingService — matching engine interaction (Provider Req Phase 12).

Gives the provider transparency into the platform's matching: eligibility —
the signals the engine weighs (rating, jobs, verification, service approval,
price, areas, availability, response rate) with derived acceptance/completion
rates — and insights — every matched request with the engine's score, rank,
strategy and human-readable reasons plus what happened after (response,
quote, booking). Pure read aggregation over existing tables.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from app.shared.exceptions.hierarchy import NotFoundError


class ProviderMatchingService:
    """Owns the provider-facing matching reads and their derived rates."""

    def __init__(self, matching: Any) -> None:
        self._matching = matching

    # -- queries ---------------------------------------------------------------

    async def eligibility(self, provider_id: str) -> dict[str, Any]:
        """How the matching engine sees the provider's signals today."""
        row = await self._matching.eligibility(provider_id)
        if row is None:
            # Provider principal should always exist; defensive 404.
            raise NotFoundError("Provider not found")
        data = self._json_safe(dict(row))
        accepted = int(data.get("accepted_requests") or 0)
        declined = int(data.get("declined_requests") or 0)
        responded = accepted + declined
        rating = float(data.get("rating_avg") or 0)
        jobs = int(data.get("jobs_completed") or 0)

        # Engine-style score preview using the default strategy weights:
        # rating 40 + jobs 30 + proximity 30 (proximity needs a request, so
        # report it as a readiness-only 0 here — compelling to the provider).
        data["acceptance_rate"] = round(accepted / responded, 4) if responded else None
        data["response_time_minutes"] = data.get("response_time_minutes")
        data["completion_rate"] = None  # needs bookings history; add when present
        data["engine_score_preview"] = {
            "rating_component": round(rating / 5.0 * 40.0, 2),
            "jobs_component": round(min(jobs, 100) / 100.0 * 30.0, 2),
            "proximity_component": 0.0,
            "max_possible": 100.0,
            "notes": "Proximity is scored per-request against the customer's "
                     "location; it is 0 here because there is no live request.",
        }
        return data

    async def insights(self, provider_id: str) -> list[dict[str, Any]]:
        """Every request the engine matched this provider to, with outcome."""
        rows = await self._matching.insights(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def summary(self, provider_id: str) -> dict[str, Any]:
        """Match-opportunity counts (pending vs quoted vs accepted vs selected)."""
        row = await self._matching.summary(provider_id)
        data = self._json_safe(dict(row)) if row is not None else {
            "total_matches": 0, "pending_actions": 0, "quoted_requests": 0,
            "accepted_requests": 0, "selected_requests": 0,
        }
        total = int(data.get("total_matches") or 0)
        pending = int(data.get("pending_actions") or 0)
        data["action_rate"] = round((total - pending) / total, 4) if total else None
        return data

    # -- helpers -----------------------------------------------------------------

    @staticmethod
    def _json_safe(row: dict[str, Any]) -> dict[str, Any]:
        for key, value in row.items():
            if isinstance(value, (datetime, date)):
                row[key] = value.isoformat()
            elif isinstance(value, Decimal):
                row[key] = float(value)
            elif isinstance(value, UUID):
                row[key] = str(value)
        return row