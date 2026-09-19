"""PropertyService — customer property (home/office) rules.

Depends ONLY on PropertyRepository + AddressRepository ports. No SQL.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

PROPERTY_TYPES = ("HOUSE", "APARTMENT", "CONDO", "OFFICE", "OTHER")
ROOM_TYPES = (
    "LIVING_ROOM", "BEDROOM", "KITCHEN", "BATHROOM", "GARAGE", "OFFICE", "OTHER",
)


class PropertyService:
    def __init__(self, properties: Any, addresses: Any) -> None:
        self._properties = properties
        self._addresses = addresses

    async def list(self, customer_id: str) -> list[dict[str, Any]]:
        return await self._properties.list(customer_id)

    async def get(self, customer_id: str, property_id: str) -> dict[str, Any]:
        row = await self._properties.get(customer_id, property_id)
        if not row:
            raise NotFoundError("Property not found")
        return row

    async def create(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]:
        name = str(data.get("name") or "").strip()
        if len(name) < 2:
            raise ValidationError("Property name must be at least 2 characters")

        ptype = (data.get("property_type") or "HOUSE").upper()
        if ptype not in PROPERTY_TYPES:
            raise ValidationError(
                f"property_type must be one of: {', '.join(PROPERTY_TYPES)}"
            )

        # Ownership check: an address may be linked only if it is ours.
        address_id = data.get("address_id")
        if address_id:
            await self._addresses.get(customer_id, str(address_id))

        row = await self._properties.create(customer_id, {**data, "name": name, "property_type": ptype})
        if not row:
            raise ValidationError("Could not create the property")
        return row

    async def update(
        self, customer_id: str, property_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        await self.get(customer_id, property_id)

        if "property_type" in data:
            ptype = str(data["property_type"] or "").upper()
            if ptype not in PROPERTY_TYPES:
                raise ValidationError(
                    f"property_type must be one of: {', '.join(PROPERTY_TYPES)}"
                )
            data["property_type"] = ptype

        if "address_id" in data and data["address_id"] not in (None, "", "__CLEAR__"):
            await self._addresses.get(customer_id, str(data["address_id"]))

        row = await self._properties.update(customer_id, property_id, data)
        if not row:
            raise ValidationError("Could not update the property")
        return row

    async def delete(self, customer_id: str, property_id: str) -> dict[str, Any]:
        await self.get(customer_id, property_id)
        ok = await self._properties.delete(customer_id, property_id)
        if not ok:
            raise ValidationError("Could not delete the property")
        return {"deleted": True, "property_id": property_id}

    async def add_room(
        self, customer_id: str, property_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        await self.get(customer_id, property_id)

        room_type = str(data.get("room_type") or "").upper()
        if room_type not in ROOM_TYPES:
            raise ValidationError(f"room_type must be one of: {', '.join(ROOM_TYPES)}")
        if not str(data.get("name") or "").strip():
            raise ValidationError("Room name is required")

        row = await self._properties.add_room(customer_id, property_id, data)
        if not row:
            raise ValidationError("Could not add the room")
        return row

    async def remove_room(self, customer_id: str, room_id: str) -> dict[str, Any]:
        ok = await self._properties.remove_room(customer_id, room_id)
        if not ok:
            raise NotFoundError("Room not found")
        return {"removed": True, "room_id": room_id}