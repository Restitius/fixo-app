"""Location domain router — customer address book."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/locations", tags=["locations"])


class AddressCreate(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    recipient_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=20)
    street_address: str = Field(min_length=4, max_length=255)
    city: str = Field(min_length=2, max_length=80)
    region: str | None = None
    postal_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    delivery_instructions: str | None = None
    is_default: bool = False


class AddressUpdate(BaseModel):
    label: str | None = None
    recipient_name: str | None = None
    phone: str | None = None
    street_address: str | None = None
    city: str | None = None
    region: str | None = None
    postal_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    delivery_instructions: str | None = None


@router.get("/addresses")
async def list_addresses(customer: CurrentCustomer) -> dict:
    svc = get_composition().location_service()
    return ok(await svc.list(str(customer["customer_id"])))


@router.post("/addresses", status_code=201)
async def create_address(payload: AddressCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().location_service()
    data = payload.model_dump()
    return ok(await svc.create(str(customer["customer_id"]), data), title="Address saved", status_code=201)


@router.get("/addresses/{address_id}")
async def get_address(address_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().location_service()
    return ok(await svc.get(str(customer["customer_id"]), address_id))


@router.patch("/addresses/{address_id}")
async def update_address(
    address_id: str, payload: AddressUpdate, customer: CurrentCustomer
) -> dict:
    svc = get_composition().location_service()
    data = payload.model_dump(exclude_unset=True)
    return ok(await svc.update(str(customer["customer_id"]), address_id, data), title="Address updated")


@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().location_service()
    return ok(await svc.delete(str(customer["customer_id"]), address_id), title="Address deleted")


@router.post("/addresses/{address_id}/set-default")
async def set_default(address_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().location_service()
    return ok(await svc.set_default(str(customer["customer_id"]), address_id), title="Default updated")