"""WorkflowManager — registered state-machine transitions for stateful domains.

Workflows are registered here with their allowed transitions; SQL then
enforces the from-state guard on every persisted change, so even concurrent
writers cannot skip states. Application services ask this manager whether a
transition may happen — they never hand-edit status columns.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.shared.exceptions.hierarchy import ConflictError


@dataclass
class WorkflowDefinition:
    workflow_id: str
    initial: str
    transitions: dict[str, set[str]]
    terminal: set[str] = field(default_factory=set)


class WorkflowError(ConflictError):
    """Raised when a transition is not part of the registered machine.

    Subclasses ConflictError (HTTP 409) rather than a bare Exception so a
    disallowed transition (e.g. re-deciding an already-decided change
    request) reaches the client as a clean 409, not an unhandled 500.
    """

    default_code = "WORKFLOW.INVALID_TRANSITION"


class WorkflowManager:
    def __init__(self) -> None:
        self._workflows: dict[str, WorkflowDefinition] = {}

    # -- registration --------------------------------------------------------

    def register(self, definition: WorkflowDefinition) -> None:
        self._workflows[definition.workflow_id] = definition

    def get(self, workflow_id: str) -> WorkflowDefinition:
        wf = self._workflows.get(workflow_id)
        if wf is None:
            raise WorkflowError(f"Workflow not registered: {workflow_id}")
        return wf

    def register_service_request(self) -> None:
        """WF.SERVICE_REQUEST.V1 — Phases 4–6 customer request lifecycle."""
        self.register(
            WorkflowDefinition(
                workflow_id="WF.SERVICE_REQUEST.V1",
                initial="DRAFT",
                transitions={
                    "DRAFT":                {"SUBMITTED", "CANCELLED"},
                    "SUBMITTED":            {"VALIDATING", "CANCELLED"},
                    "VALIDATING":           {"VALID", "NEEDS_INFORMATION",
                                             "OUTSIDE_SERVICE_AREA",
                                             "NO_PROVIDER_AVAILABLE"},
                    "NEEDS_INFORMATION":    {"VALIDATING", "CANCELLED"},
                    "OUTSIDE_SERVICE_AREA": {"CANCELLED"},
                    "NO_PROVIDER_AVAILABLE": {"CANCELLED"},
                    "VALID":                {"MATCHING", "CANCELLED"},
                    "MATCHING":             {"PROVIDER_SELECTED", "NO_PROVIDER_AVAILABLE",
                                             "CANCELLED"},
                    "PROVIDER_SELECTED":    {"QUOTE_ACCEPTED", "CANCELLED"},
                    "QUOTE_ACCEPTED":       {"CONFIRMED", "CANCELLED"},
                    "CONFIRMED":            set(),   # terminal on the request side
                    "CANCELLED":            set(),
                },
                terminal={"CONFIRMED", "CANCELLED"},
            )
        )

    def register_booking(self) -> None:
        """WF.BOOKING.CUSTOMER.V1 — Phase 6 booking + payment lifecycle."""
        self.register(
            WorkflowDefinition(
                workflow_id="WF.BOOKING.CUSTOMER.V1",
                initial="CONFIRMED",
                transitions={
                    "CONFIRMED":         {"PAYMENT_AUTHORIZED", "PAYMENT_FAILED",
                                          "CANCELLED"},
                    "PAYMENT_FAILED":    {"CONFIRMED", "CANCELLED"},   # retry loop
                    "PAYMENT_AUTHORIZED": {"ON_THE_WAY", "CANCELLED"},
                    "ON_THE_WAY":        {"ARRIVED", "CANCELLED"},
                    "ARRIVED":           {"STARTED", "CANCELLED"},
                    "STARTED":           {"IN_PROGRESS", "CANCELLED"},
                    "IN_PROGRESS":       {"COMPLETION_REQUESTED", "CANCELLED"},
                    "COMPLETION_REQUESTED": {"CUSTOMER_CONFIRMED", "CANCELLED"},
                    "CUSTOMER_CONFIRMED": {"PAID", "CANCELLED"},
                    "PAID":               {"CLOSED"},
                    "CLOSED":             set(),
                    "CANCELLED":          set(),
                },
                terminal={"CLOSED", "CANCELLED"},
            )
        )

    def register_change_request(self) -> None:
        """WF.CHANGE_REQUEST.V1 — Module 24 approval lifecycle."""
        self.register(
            WorkflowDefinition(
                workflow_id="WF.CHANGE_REQUEST.V1",
                initial="PROPOSED",
                transitions={
                    "PROPOSED": {"APPROVED", "DECLINED"},
                },
                terminal={"APPROVED", "DECLINED"},
            )
        )

    def register_service_execution(self) -> None:
        """WF.SERVICE.EXECUTION.V1 — on-site execution slice (Module 23)."""
        self.register(
            WorkflowDefinition(
                workflow_id="WF.SERVICE.EXECUTION.V1",
                initial="STARTED",
                transitions={
                    "STARTED":     {"IN_PROGRESS"},
                    "IN_PROGRESS": {"COMPLETION_REQUESTED"},
                },
                terminal={"COMPLETION_REQUESTED"},
            )
        )

    def register_dispute(self) -> None:
        """WF.DISPUTE.V1 — Module 39 dispute lifecycle."""
        self.register(
            WorkflowDefinition(
                workflow_id="WF.DISPUTE.V1",
                initial="OPEN",
                transitions={
                    "OPEN":         {"UNDER_REVIEW", "WITHDRAWN"},
                    "UNDER_REVIEW": {"RESOLVED_CUSTOMER_FAVOR",
                                     "RESOLVED_PROVIDER_FAVOR",
                                     "REJECTED"},
                },
                terminal={"RESOLVED_CUSTOMER_FAVOR", "RESOLVED_PROVIDER_FAVOR",
                          "REJECTED", "WITHDRAWN"},
            )
        )

    def register_support_ticket(self) -> None:
        """WF.SUPPORT.TICKET.V1 — Module 38 helpdesk lifecycle."""
        self.register(
            WorkflowDefinition(
                workflow_id="WF.SUPPORT.TICKET.V1",
                initial="OPEN",
                transitions={
                    "OPEN":        {"IN_PROGRESS", "CLOSED"},
                    "IN_PROGRESS": {"RESOLVED", "CLOSED"},
                    "RESOLVED":    {"CLOSED", "OPEN"},   # reopened if unsatisfied
                },
                terminal={"CLOSED"},
            )
        )

    # -- queries ---------------------------------------------------------------

    def can_transition(self, workflow_id: str, from_state: str, to_state: str) -> bool:
        wf = self.get(workflow_id)
        return to_state in wf.transitions.get(from_state, set())

    def next_states(self, workflow_id: str, from_state: str) -> set[str]:
        return set(self.get(workflow_id).transitions.get(from_state, set()))

    def is_terminal(self, workflow_id: str, state: str) -> bool:
        return state in self.get(workflow_id).terminal

    # -- application -------------------------------------------------------------

    async def transition(
        self,
        *,
        workflow_id: str,
        from_state: str,
        to_state: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Validate a transition against the registered machine."""
        if not self.can_transition(workflow_id, from_state, to_state):
            raise WorkflowError(
                f"Transition {from_state} → {to_state} is not allowed "
                f"in {workflow_id}"
            )
        return {
            "approved": True,
            "workflow_id": workflow_id,
            "from_state": from_state,
            "to_state": to_state,
            "context": context or {},
        }