"""MatchingService — Modules 12 & 13: engine + provider selection.

Runs the registered strategy over the candidate pool, persists ranked
candidates, flips the request into MATCHING, and auto-creates instant quotes
from the top providers' rate cards. Depends ONLY on ports.
"""
from __future__ import annotations

import logging
from typing import Any

from app.domains.matching.ranking_engine import RankingEngine
from app.domains.matching.strategies import STRATEGIES, pick_strategy
from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

TOP_CANDIDATES = 6      # persisted, ranked
INSTANT_QUOTES = 3      # auto-estimates created for the best ones


class MatchingService:
    def __init__(
        self,
        matching: Any,       # MatchingRepository port
        quotations: Any,     # QuotationRepository port
        requests: Any,       # ServiceRequestRepository port
        workflows: Any,      # WorkflowManager (injected)
    ) -> None:
        self._matching = matching
        self._quotations = quotations
        self._requests = requests
        self._workflows = workflows

    async def run_matching(self, customer_id: str, request_id: str) -> dict[str, Any]:
        view = await self._require(customer_id, request_id)
        if view["status"] != "VALID":
            raise ValidationError(
                f"Only VALID requests can be matched (current: {view['status']})"
            )

        # Strategy selection rule (documented in strategies.py).
        has_repeat = any(c.get("repeat_customer") for c in [])
        urgent = str(view.get("time_window") or "") == "EMERGENCY"
        strategy_id = pick_strategy(urgent=urgent, has_repeat_history=has_repeat)
        weights = STRATEGIES[strategy_id]

        pool = await self._matching.search_candidates(
            service_id=view["service_id"],
            customer_id=customer_id,
            city=view.get("address_city"),
            region=view.get("address_region"),
        )
        if not pool:
            await self._apply(customer_id, request_id, "VALID", "NO_PROVIDER_AVAILABLE", view)
            return {"strategy": strategy_id, "matches": [], "outcome": "NO_PROVIDER_AVAILABLE"}

        ranked = sorted(
            (
                RankingEngine.score(c, weights, request_city=view.get("address_city"))
                for c in pool
            ),
            key=lambda s: s.score,
            reverse=True,
        )[:TOP_CANDIDATES]

        matches = []
        for pos, scored in enumerate(ranked, start=1):
            saved = await self._matching.save_candidate(
                request_id,
                {
                    "provider_id": scored.provider_id,
                    "strategy": strategy_id,
                    "score": scored.score,
                    "rank_pos": pos,
                    "reasons": scored.reasons,
                },
            )
            matches.append(saved)

        # Instant estimates from the top providers' rate cards.
        base_by_provider = {str(c["provider_id"]): float(c["base_amount"]) for c in pool}
        for m in matches[:INSTANT_QUOTES]:
            pid = str(m["provider_id"])
            if pid in base_by_provider:
                await self._quotations.auto_create(
                    request_id,
                    {
                        "provider_id": pid,
                        "amount": base_by_provider[pid],
                        "lead_time_days": 1,
                        "message": f"Instant estimate — {weights.description}",
                    },
                )

        await self._apply(customer_id, request_id, "VALID", "MATCHING", view)

        stored = await self._matching.list_matches(customer_id, request_id)
        logger.info("matching done %s: %d candidates via %s",
                    request_id, len(stored), strategy_id)
        return {"strategy": strategy_id, "outcome": "MATCHING", "matches": stored}

    async def select_provider(
        self, customer_id: str, request_id: str, provider_id: str
    ) -> dict[str, Any]:
        view = await self._require(customer_id, request_id)
        if view["status"] != "MATCHING":
            raise ValidationError("Select a provider while the request is MATCHING")

        matches = await self._matching.list_matches(customer_id, request_id)
        chosen = next((m for m in matches if str(m["provider_id"]) == str(provider_id)), None)
        if chosen is None:
            raise ValidationError("Provider is not among the matched candidates")

        row = await self._requests.set_provider(customer_id, request_id, provider_id)
        if not row:
            raise ValidationError("Could not record the selected provider")

        await self._apply(customer_id, request_id, "MATCHING", "PROVIDER_SELECTED", view)
        return await self._require(customer_id, request_id)

    async def list_matches(self, customer_id: str, request_id: str) -> list[dict[str, Any]]:
        await self._require(customer_id, request_id)
        return await self._matching.list_matches(customer_id, request_id)

    async def _require(self, customer_id: str, request_id: str) -> dict[str, Any]:
        row = await self._requests.get(customer_id, request_id)
        if not row:
            raise NotFoundError("Service request not found")
        return row

    async def _apply(self, customer_id: str, request_id: str,
                     from_state: str, to_state: str, view: dict[str, Any]) -> None:
        await self._workflows.transition(
            workflow_id="WF.SERVICE_REQUEST.V1",
            from_state=from_state, to_state=to_state,
            context={"request_number": view.get("request_number")},
        )
        row = await self._requests.set_status(
            customer_id, request_id, from_state=from_state, to_state=to_state
        )
        if not row:
            raise ValidationError(f"State moved concurrently ({from_state} → {to_state})")