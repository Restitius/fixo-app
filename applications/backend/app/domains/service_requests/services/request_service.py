"""RequestService — Phase-4 lifecycle orchestrator.

Drives WF.SERVICE_REQUEST.V1 through the injected workflow manager, runs the
EligibilityEngine at submit-time, and owns the evidence upload rules.
Depends ONLY on ports + injected managers. No SQL, no query IDs.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

WORKFLOW = "WF.SERVICE_REQUEST.V1"
TIME_WINDOWS = ("MORNING", "AFTERNOON", "EVENING")
EDITABLE_STATUSES = {"DRAFT", "SUBMITTED", "VALIDATING", "NEEDS_INFORMATION"}
MAX_EVIDENCE = 5


class RequestService:
    def __init__(
        self,
        requests: Any,        # ServiceRequestRepository port
        evidences: Any,       # EvidenceRepository port
        areas: Any,           # ServiceAreaPort
        addresses: Any,       # AddressRepository port (ownership checks)
        properties: Any,      # PropertyRepository port (ownership checks)
        workflows: Any,       # WorkflowManager (platform) — duck-typed here
        files: Any | None = None,   # FileManager — optional until wired
        events: Any | None = None,
    ) -> None:
        self._requests = requests
        self._evidences = evidences
        self._areas = areas
        self._addresses = addresses
        self._properties = properties
        self._workflows = workflows
        self._files = files
        self._events = events

    # -- commands -------------------------------------------------------------

    async def create(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]:
        description = str(data.get("description") or "").strip()
        if len(description) < 10:
            raise ValidationError("Describe the job in at least 10 characters")

        window = str(data.get("time_window") or "").upper() or None
        if window and window not in TIME_WINDOWS:
            raise ValidationError(f"time_window must be one of: {', '.join(TIME_WINDOWS)}")

        await self._ensure_link_owned(customer_id, data)

        row = await self._requests.create(customer_id, {**data, "description": description})
        if not row:
            raise ValidationError("Could not create the service request")

        created = await self.get(customer_id, row["request_id"])
        await self._publish(
            "EVT.REQUEST.CREATED",
            {"request_id": row["request_id"], "customer_id": customer_id,
             "service_id": data.get("service_id")},
        )
        return created

    async def update_draft(
        self, customer_id: str, request_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        current = await self.get(customer_id, request_id)
        if current["status"] != "DRAFT":
            raise ValidationError("Only DRAFT requests can be edited")

        await self._ensure_link_owned(customer_id, data)

        row = await self._requests.update_draft(customer_id, request_id, data)
        if not row:
            raise ValidationError("Could not update the request")
        return await self.get(customer_id, request_id)

    async def cancel(self, customer_id: str, request_id: str) -> dict[str, Any]:
        current = await self.get(customer_id, request_id)
        if self._workflows.is_terminal(WORKFLOW, current["status"]):
            raise ValidationError(
                f"Requests in status '{current['status']}' cannot be cancelled"
            )
        await self._apply(customer_id, request_id, current["status"], "CANCELLED", current)
        return await self.get(customer_id, request_id)

    # -- queries ------------------------------------------------------------------

    async def get(self, customer_id: str, request_id: str) -> dict[str, Any]:
        row = await self._requests.get(customer_id, request_id)
        if not row:
            raise NotFoundError("Service request not found")
        return row

    async def list(
        self, customer_id: str, *, status: str | None = None,
        limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._requests.list(
            customer_id, status=status, limit=limit, offset=offset
        )

    async def submit(self, customer_id: str, request_id: str) -> dict[str, Any]:
        """DRAFT/NEEDS_INFORMATION → SUBMITTED → VALIDATING → outcome."""
        from app.domains.service_requests.services.eligibility_engine import (
            EligibilityEngine,
        )

        current = await self.get(customer_id, request_id)
        status = current["status"]

        entry = "NEEDS_INFORMATION" if status == "NEEDS_INFORMATION" else "DRAFT"
        if status != entry:
            raise ValidationError(f"Requests in status '{status}' cannot be submitted")

        await self._apply(customer_id, request_id, entry, "SUBMITTED", current)
        await self._apply(customer_id, request_id, "SUBMITTED", "VALIDATING", current)

        engine = EligibilityEngine(self._areas)
        decision = await engine.evaluate(
            service_is_active=bool(current.get("service_is_active")),
            description=current.get("description") or "",
            address_city=current.get("address_city"),
            address_region=current.get("address_region"),
            preferred_date=current.get("preferred_date"),
        )

        final_row = await self._requests.set_status(
            customer_id, request_id,
            from_state="VALIDATING", to_state=decision.outcome,
            notes="; ".join(decision.reasons) or None,
        )
        if not final_row:
            raise ValidationError("Could not persist the validation result")

        await self._publish(
            "EVT.REQUEST.VALIDATED",
            {"request_id": request_id, "outcome": decision.outcome,
             "reasons": decision.reasons},
        )
        return await self.get(customer_id, request_id)

    # -- evidence ---------------------------------------------------------------

    async def add_evidence(
        self, customer_id: str, request_id: str, *,
        name: str, content: bytes, content_type: str | None
    ) -> dict[str, Any]:
        current = await self.get(customer_id, request_id)
        if current["status"] not in EDITABLE_STATUSES:
            raise ValidationError(
                f"Evidence cannot be added in status '{current['status']}'"
            )
        if await self._evidences.count(customer_id, request_id) >= MAX_EVIDENCE:
            raise ValidationError(f"Maximum {MAX_EVIDENCE} files per request")
        if self._files is None:
            raise ValidationError("File storage is not available")

        meta = await self._files.upload(
            name=name, content=content, content_type=content_type,
            folder=f"evidence/{str(request_id)[:8]}",
        )
        row = await self._evidences.add(customer_id, request_id, meta)
        if not row:
            await self._files.delete(meta["storage_key"])  # don't orphan blobs
            raise ValidationError("Could not attach the file")
        return row

    async def list_evidence(self, customer_id: str, request_id: str) -> list[dict[str, Any]]:
        await self.get(customer_id, request_id)
        return await self._evidences.list(customer_id, request_id)

    async def delete_evidence(
        self, customer_id: str, request_id: str, evidence_id: str
    ) -> dict[str, Any]:
        key = await self._evidences.delete(customer_id, request_id, evidence_id)
        if not key:
            raise NotFoundError("Evidence not found")
        if self._files is not None:
            await self._files.delete(key)
        return {"deleted": True, "evidence_id": evidence_id}

    # -- internals -------------------------------------------------------------------

    async def _apply(
        self, customer_id: str, request_id: str,
        from_state: str, to_state: str, view: dict[str, Any],
    ) -> None:
        await self._workflows.transition(
            workflow_id=WORKFLOW, from_state=from_state, to_state=to_state,
            context={"request_number": view.get("request_number")},
        )
        row = await self._requests.set_status(
            customer_id, request_id, from_state=from_state, to_state=to_state
        )
        if not row:
            raise ValidationError(
                f"Request state changed concurrently ({from_state} → {to_state} failed)"
            )

    async def _ensure_link_owned(self, customer_id: str, data: dict[str, Any]) -> None:
        address_id = data.get("address_id")
        property_id = data.get("property_id")
        if address_id:
            await self._addresses.get(customer_id, str(address_id))
        if property_id:
            await self._properties.get(customer_id, str(property_id))

    async def _publish(self, name: str, payload: dict[str, Any]) -> None:
        if self._events is None:
            return
        from app.events.event import make_event

        await self._events.publish(make_event(name, payload))