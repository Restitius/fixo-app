"""WorkflowGateway — state-machine transitions for stateful domains."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class WorkflowGateway(Protocol):
    """Transition a stateful domain object through a registered workflow."""

    async def transition(self, *, domain: str, from_state: str, to_state: str, context: dict[str, Any] | None = None) -> Any: ...