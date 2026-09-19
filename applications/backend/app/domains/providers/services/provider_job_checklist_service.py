"""ProviderJobChecklistService — provider job checklist workflows (Requirement Phase 21).

Some service types contain predefined workflows (e.g. Air Conditioning
Service). The provider defines a reusable template per service once, then
instantiates it onto a booking and checks tasks as they are completed.
This improves service consistency and auditability.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import AuthorizationError, NotFoundError


class ProviderJobChecklistService:
    def __init__(self, checklist: Any) -> None:
        self._checklist = checklist

    # -- template management ------------------------------------------------

    async def upsert_template(
        self,
        provider_id: str,
        service_id: str,
        title: str,
        items: list[str],
    ) -> dict[str, Any]:
        cleaned = [str(t).strip() for t in items if str(t).strip()]
        if not cleaned:
            raise AuthorizationError("Checklist template must contain at least one task")
        if len(title.strip()) == 0:
            raise AuthorizationError("Checklist template title is required")
        row = await self._checklist.template_upsert(
            provider_id=provider_id,
            service_id=service_id,
            title=title.strip(),
            items=cleaned,
        )
        if not row:
            raise NotFoundError(f"Service {service_id} not found for this provider")
        return self._decode_template(row)

    async def get_template(self, provider_id: str, service_id: str) -> dict[str, Any]:
        row = await self._checklist.template_get(
            provider_id=provider_id, service_id=service_id
        )
        if not row:
            raise NotFoundError(f"No checklist template for service {service_id}")
        return self._decode_template(row)

    async def delete_template(self, provider_id: str, service_id: str) -> dict[str, Any]:
        row = await self._checklist.template_delete(
            provider_id=provider_id, service_id=service_id
        )
        if not row:
            raise NotFoundError(f"No active checklist template for service {service_id}")
        return {"service_id": service_id, "deactivated": True}

    # -- booking instantiation ----------------------------------------------

    async def instantiate(
        self, provider_id: str, booking_id: str, service_id: str
    ) -> dict[str, Any]:
        """Apply the provider's template for a service onto a booking (idempotent)."""
        rows = await self._checklist.instantiate(
            provider_id=provider_id, booking_id=booking_id, service_id=service_id
        )
        if not rows:
            # Either no active template, or already instantiated.
            existing = await self._checklist.list_for_booking(
                provider_id=provider_id, booking_id=booking_id
            )
            if existing:
                return {
                    "booking_id": booking_id,
                    "items": self._decode_items(existing),
                    "already_instantiated": True,
                }
            template = await self._checklist.template_get(
                provider_id=provider_id, service_id=service_id
            )
            if not template:
                raise NotFoundError(
                    f"No active checklist template for service {service_id}"
                )
            raise NotFoundError("Could not instantiate checklist")
        return {
            "booking_id": booking_id,
            "items": self._decode_items(rows),
            "already_instantiated": False,
        }

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any]:
        rows = await self._checklist.list_for_booking(
            provider_id=provider_id, booking_id=booking_id
        )
        return self._decode_items(rows)

    async def set_completed(
        self,
        provider_id: str,
        booking_id: str,
        item_id: str,
        is_completed: bool = True,
    ) -> dict[str, Any]:
        row = await self._checklist.set_completed(
            provider_id=provider_id,
            booking_id=booking_id,
            item_id=item_id,
            is_completed=is_completed,
        )
        if not row:
            raise NotFoundError(
                f"Checklist item {item_id} not found for booking {booking_id}"
            )
        return row

    async def progress(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        row = await self._checklist.progress(
            provider_id=provider_id, booking_id=booking_id
        )
        if not row:
            raise NotFoundError(f"Checklist not instantiated for booking {booking_id}")
        return row

    # -- helpers --------------------------------------------------------------

    def _decode_template(self, row: dict[str, Any]) -> dict[str, Any]:
        data = dict(row)
        items = data.get("items")
        if isinstance(items, str):
            try:
                import json

                items = json.loads(items)
            except Exception:
                items = []
        data["items"] = [str(i) for i in (items or [])]
        return data

    def _decode_items(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [dict(r) for r in rows]