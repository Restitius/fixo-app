"""Provider equipment & tools registry router - Phase 46.

Prefix: /providers/me/equipment
"""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/equipment", tags=["provider-equipment"])


class CreateEquipmentRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = "OTHER"
    serial_number: str | None = Field(default=None, max_length=100)
    condition: str = "GOOD"
    purchase_date: date | None = None
    notes: str | None = Field(default=None, max_length=2000)


class UpdateEquipmentRequest(BaseModel):
    name: str | None = Field(default=None, max_length=150)
    category: str | None = None
    serial_number: str | None = Field(default=None, max_length=100)
    condition: str | None = None
    status: str | None = None
    notes: str | None = Field(default=None, max_length=2000)


class AssignEquipmentRequest(BaseModel):
    member_id: str | None = None


@router.post("/", status_code=201)
async def create_equipment(payload: CreateEquipmentRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_equipment_service()
    record = await svc.create(
        str(provider["provider_id"]),
        name=payload.name,
        category=payload.category,
        serial_number=payload.serial_number,
        condition=payload.condition,
        purchase_date=payload.purchase_date,
        notes=payload.notes,
    )
    return ok(record, title="Equipment registered", status_code=201)


@router.get("/")
async def list_equipment(
    provider: CurrentProvider,
    status: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_equipment_service()
    return ok(
        await svc.list_equipment(
            str(provider["provider_id"]), status=status, category=category, limit=limit, offset=offset
        )
    )


@router.get("/{equipment_id}")
async def get_equipment(equipment_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_equipment_service()
    return ok(await svc.get(str(provider["provider_id"]), equipment_id=equipment_id))


@router.patch("/{equipment_id}")
async def update_equipment(
    equipment_id: str, payload: UpdateEquipmentRequest, provider: CurrentProvider
) -> dict:
    svc = get_composition().provider_equipment_service()
    record = await svc.update(
        str(provider["provider_id"]),
        equipment_id=equipment_id,
        name=payload.name,
        category=payload.category,
        serial_number=payload.serial_number,
        condition=payload.condition,
        status=payload.status,
        notes=payload.notes,
    )
    return ok(record, title="Equipment updated")


@router.post("/{equipment_id}/assign")
async def assign_equipment(
    equipment_id: str, payload: AssignEquipmentRequest, provider: CurrentProvider
) -> dict:
    svc = get_composition().provider_equipment_service()
    result = await svc.assign(
        str(provider["provider_id"]), equipment_id=equipment_id, member_id=payload.member_id
    )
    return ok(result, title="Equipment assignment updated")


@router.post("/{equipment_id}/retire")
async def retire_equipment(equipment_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_equipment_service()
    result = await svc.retire(str(provider["provider_id"]), equipment_id=equipment_id)
    return ok(result, title="Equipment retired")
