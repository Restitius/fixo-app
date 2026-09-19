"""QuotationService — Module 15: list and accept offers.

Accepting runs SP_ACCEPT_QUOTE (target ACCEPTED, siblings EXPIRED) and moves
the request PROVIDER_SELECTED → QUOTE_ACCEPTED through the workflow machine.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class QuotationService:
    def __init__(
        self,
        quotations: Any,     # QuotationRepository port
        requests: Any,       # ServiceRequestRepository port (ownership + state)
        workflows: Any,      # WorkflowManager (injected)
    ) -> None:
        self._quotations = quotations
        self._requests = requests
        self._workflows = workflows

    async def list_for_request(
        self, customer_id: str, request_id: str
    ) -> list[dict[str, Any]]:
        await self._require_request(customer_id, request_id)
        return await self._quotations.list_for_request(customer_id, request_id)

    async def get(self, customer_id: str, quote_id: str) -> dict[str, Any]:
        row = await self._quotations.get_owned(customer_id, quote_id)
        if not row:
            raise NotFoundError("Quotation not found")
        return row

    async def accept(
        self, customer_id: str, quote_id: str
    ) -> dict[str, Any]:
        quote = await self.get(customer_id, quote_id)
        if quote["status"] != "SUBMITTED":
            raise ValidationError(
                f"Only SUBMITTED quotes can be accepted (current: {quote['status']})"
            )

        request = await self._require_request(customer_id, str(quote["request_id"]))
        selected = str(request.get("selected_provider_id") or "")
        if selected != str(quote["provider_id"]):
            raise ValidationError(
                "Select this provider on the request before accepting their quote"
            )

        accepted = await self._quotations.accept(
            customer_id, str(quote["request_id"]), quote_id
        )
        if not accepted:
            raise ValidationError("Quote is no longer available")

        # Workflow guard first; then persist via the same guarded UPDATE.
        view = request
        await self._workflows.transition(
            workflow_id="WF.SERVICE_REQUEST.V1",
            from_state=view["status"], to_state="QUOTE_ACCEPTED",
            context={"quote_id": quote_id},
        )
        row = await self._requests.set_status(
            customer_id, str(view["request_id"]),
            from_state=view["status"], to_state="QUOTE_ACCEPTED",
        )
        if not row:
            raise ValidationError("Request state moved during acceptance")

        logger.info("quote %s accepted for request %s", quote_id, view["request_id"])
        return {
            **(await self._quotations.get_owned(customer_id, quote_id) or {}),
            "request_status": "QUOTE_ACCEPTED",
        }

    async def _require_request(
        self, customer_id: str, request_id: str
    ) -> dict[str, Any]:
        row = await self._requests.get(customer_id, request_id)
        if not row:
            raise NotFoundError("Service request not found")
        return row