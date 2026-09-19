"""Warranties domain router — Phase 10 module 29."""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/warranties", tags=["warranties"])


class ClaimCreate(BaseModel):
    description: str = Field(min_length=10, max_length=2000)


@router.get("")
async def list_warranties(
    customer: CurrentCustomer,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=20),
) -> dict:
    svc = get_composition().warranty_service()
    return ok(await svc.list(str(customer["customer_id"]), page, limit))


@router.get("/{warranty_id}")
async def get_warranty(warranty_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().warranty_service()
    return ok(await svc.get(str(customer["customer_id"]), warranty_id))


@router.post("/{warranty_id}/claim", status_code=201)
async def claim_warranty(warranty_id: str, payload: ClaimCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().warranty_service()
    return ok(await svc.claim(str(customer["customer_id"]), warranty_id, payload.description),
              title="Claim submitted", status_code=201)
