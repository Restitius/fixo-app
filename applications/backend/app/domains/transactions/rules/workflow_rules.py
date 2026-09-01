"""Transaction workflow/state-transition rules (pure predicates)."""
from __future__ import annotations

def only_pending_can_settle(status: str) -> bool:
    """Transitions to SETTLED are legal only from PENDING."""
    return status == "PENDING"


def settle_requires_occurred_at(has_occurred_at: bool) -> bool:
    """A settlement timestamp must exist (explicit or server clock)."""
    return has_occurred_at
