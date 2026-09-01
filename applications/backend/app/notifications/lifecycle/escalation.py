"""Escalation policy — promote unacknowledged critical alerts."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class EscalationLevel(str, Enum):
    NONE = "none"
    REMIND = "remind"
    SUPERVISOR = "supervisor"
    CRITICAL = "critical"


@dataclass(frozen=True)
class EscalationDecision:
    level: EscalationLevel
    reason: str = ""


class EscalationPolicy:
    async def evaluate(self, notification: dict) -> EscalationDecision:
        """Decide escalation from age/severity/ack state (impl phase)."""
        raise NotImplementedError("EscalationPolicy.evaluate")
