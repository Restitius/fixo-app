"""EligibilityEngine — pure Phase-4 request validation rules.

No SQL, no ports-with-side-effects except ServiceAreaPort lookup. Produces a
single outcome consumed by the workflow machine:

    VALID | NEEDS_INFORMATION | OUTSIDE_SERVICE_AREA
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class Decision:
    outcome: str
    reasons: list[str] = field(default_factory=list)

    @property
    def valid(self) -> bool:
        return self.outcome == "VALID"


class EligibilityEngine:
    def __init__(self, service_area: Any) -> None:
        # ServiceAreaPort — the only outside capability the engine may use.
        self._areas = service_area

    async def evaluate(
        self,
        *,
        service_is_active: bool,
        description: str,
        address_city: str | None,
        address_region: str | None,
        preferred_date: Any = None,
        evidence_count: int = 0,
    ) -> Decision:
        reasons: list[str] = []

        # 1. The requested service must still be offered.
        if not service_is_active:
            reasons.append("This service is currently unavailable")
            return Decision("NEEDS_INFORMATION", reasons)

        # 2. Enough information to route the job?
        if len((description or "").strip()) < 10:
            reasons.append("Describe the job in at least 10 characters")
        if not address_city and not address_region:
            reasons.append("Attach a service address to the request")

        # 3. Schedule sanity — no past dates.
        if preferred_date:
            try:
                wanted = preferred_date if isinstance(preferred_date, date) \
                    else date.fromisoformat(str(preferred_date)[:10])
                if wanted < date.today():
                    reasons.append("Preferred date cannot be in the past")
            except ValueError:
                reasons.append("Preferred date format is invalid")

        if reasons:
            return Decision("NEEDS_INFORMATION", reasons)

        # 4. Geography gate.
        served = await self._areas.is_served(
            city=address_city, region=address_region
        )
        if not served:
            reasons.append(
                f"We do not serve {address_city or address_region or 'that area'} yet"
            )
            return Decision("OUTSIDE_SERVICE_AREA", reasons)

        # Note: NO_PROVIDER_AVAILABLE lands here once Phase-5 matching exists.
        logger.debug("request eligible: city=%s region=%s", address_city, address_region)
        return Decision("VALID", ["Request passed all eligibility checks"])