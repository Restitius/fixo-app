"""AddressService — customer address book rules.

Depends ONLY on AddressRepository (port) + EventPublisher. No SQL, no IDs.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

REQUIRED = ("label", "recipient_name", "phone", "street_address", "city")


class AddressService:
    def __init__(self, addresses: Any, events: Any = None) -> None:
        self._addresses = addresses
        self._events = events

    async def list(self, customer_id: str) -> list[dict[str, Any]]:
        return await self._addresses.list(customer_id)

    async def get(self, customer_id: str, address_id: str) -> dict[str, Any]:
        row = await self._addresses.get(customer_id, address_id)
        if not row:
            raise NotFoundError("Address not found")
        return row

    async def create(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]:
        self._validate(data)

        # Business rule: the FIRST address becomes the default automatically.
        existing = await self._addresses.list(customer_id)
        if not existing:
            data["is_default"] = True

        row = await self._addresses.create(customer_id, data)
        if not row:
            raise ValidationError("Could not save the address")
        await self._publish("EVT.ADDRESS.CREATED", row)
        return row

    async def update(
        self, customer_id: str, address_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        await self.get(customer_id, address_id)  # 404 when absent/not owned
        row = await self._addresses.update(customer_id, address_id, data)
        if not row:
            raise ValidationError("Could not update the address")
        return row

    async def delete(self, customer_id: str, address_id: str) -> dict[str, Any]:
        await self.get(customer_id, address_id)
        ok = await self._addresses.delete(customer_id, address_id)
        if not ok:
            raise ValidationError("Could not delete the address")
        await self._publish("EVT.ADDRESS.DELETED", {"address_id": address_id})
        return {"deleted": True, "address_id": address_id}

    async def set_default(self, customer_id: str, address_id: str) -> dict[str, Any]:
        await self.get(customer_id, address_id)
        ok = await self._addresses.set_default(customer_id, address_id)
        if not ok:
            raise ValidationError("Could not set the default address")
        return {"address_id": address_id, "is_default": True}

    @staticmethod
    def _validate(data: dict[str, Any]) -> None:
        missing = [f for f in REQUIRED if not str(data.get(f) or "").strip()]
        if missing:
            raise ValidationError(
                f"Missing required field(s): {', '.join(missing)}"
            )

    async def _publish(self, name: str, payload: dict[str, Any]) -> None:
        if self._events is None:
            return
        from app.events.event import make_event

        await self._events.publish(make_event(name, payload))