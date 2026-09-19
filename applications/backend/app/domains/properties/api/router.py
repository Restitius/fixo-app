"""Property domain router — customer homes/offices and their rooms."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/properties", tags=["properties"])


class PropertyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    property_type: str = "HOUSE"
    address_id: str | None = None
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    bathrooms: int | None = Field(default=None, ge=0, le=50)
    year_built: int | None = Field(default=None, ge=1800, le=2100)
    notes: str | None = None


class PropertyUpdate(BaseModel):
    name: str | None = None
    property_type: str | None = None
    # "__CLEAR__" unlinks the address; null leaves it untouched.
    address_id: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    year_built: int | None = None
    notes: str | None = None


class RoomCreate(BaseModel):
    room_type: str
    name: str = Field(min_length=1, max_length=80)
    notes: str | None = None


@router.get("")
async def list_properties(customer: CurrentCustomer) -> dict:
    svc = get_composition().property_service()
    return ok(await svc.list(str(customer["customer_id"])))


@router.post("", status_code=201)
async def create_property(payload: PropertyCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().property_service()
    data = payload.model_dump()
    return ok(await svc.create(str(customer["customer_id"]), data), title="Property added", status_code=201)


@router.get("/{property_id}")
async def get_property(property_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().property_service()
    return ok(await svc.get(str(customer["customer_id"]), property_id))


@router.patch("/{property_id}")
async def update_property(
    property_id: str, payload: PropertyUpdate, customer: CurrentCustomer
) -> dict:
    svc = get_composition().property_service()
    data = payload.model_dump(exclude_unset=True)
    return ok(await svc.update(str(customer["customer_id"]), property_id, data), title="Property updated")


@router.delete("/{property_id}")
async def delete_property(property_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().property_service()
    return ok(await svc.delete(str(customer["customer_id"]), property_id), title="Property removed")


@router.post("/{property_id}/rooms", status_code=201)
async def add_room(property_id: str, payload: RoomCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().property_service()
    data = payload.model_dump()
    return ok(await svc.add_room(str(customer["customer_id"]), property_id, data), title="Room added", status_code=201)


@router.delete("/rooms/{room_id}")
async def remove_room(room_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().property_service()
    return ok(await svc.remove_room(str(customer["customer_id"]), room_id), title="Room removed")