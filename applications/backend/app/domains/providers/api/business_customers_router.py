"""Provider business customers & negotiated rates router - Phase 43.

Prefix: /providers/me/business-customers
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/business-customers", tags=["provider-business-customers"])


class CreateBusinessCustomerRequest(BaseModel):
    customer_id: str
    company_name: str | None = Field(default=None, max_length=200)
    negotiated_rate_type: str = "PERCENT_DISCOUNT"
    negotiated_rate_value: float = Field(ge=0)
    notes: str | None = Field(default=None, max_length=2000)


class UpdateBusinessCustomerRequest(BaseModel):
    company_name: str | None = Field(default=None, max_length=200)
    negotiated_rate_type: str | None = None
    negotiated_rate_value: float | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=2000)


@router.post("/", status_code=201)
async def create_business_customer(
    payload: CreateBusinessCustomerRequest, provider: CurrentProvider
) -> dict:
    svc = get_composition().provider_business_customers_service()
    record = await svc.create(
        str(provider["provider_id"]),
        customer_id=payload.customer_id,
        company_name=payload.company_name,
        negotiated_rate_type=payload.negotiated_rate_type,
        negotiated_rate_value=payload.negotiated_rate_value,
        notes=payload.notes,
    )
    return ok(record, title="Business customer registered", status_code=201)


@router.get("/")
async def list_business_customers(
    provider: CurrentProvider,
    status: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_business_customers_service()
    return ok(
        await svc.list_customers(
            str(provider["provider_id"]), status=status, limit=limit, offset=offset
        )
    )


@router.get("/{record_id}")
async def get_business_customer(record_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_business_customers_service()
    return ok(await svc.get(str(provider["provider_id"]), record_id=record_id))


@router.patch("/{record_id}")
async def update_business_customer(
    record_id: str, payload: UpdateBusinessCustomerRequest, provider: CurrentProvider
) -> dict:
    svc = get_composition().provider_business_customers_service()
    record = await svc.update(
        str(provider["provider_id"]),
        record_id=record_id,
        company_name=payload.company_name,
        negotiated_rate_type=payload.negotiated_rate_type,
        negotiated_rate_value=payload.negotiated_rate_value,
        notes=payload.notes,
    )
    return ok(record, title="Business customer updated")


@router.post("/{record_id}/deactivate")
async def deactivate_business_customer(record_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_business_customers_service()
    result = await svc.deactivate(str(provider["provider_id"]), record_id=record_id)
    return ok(result, title="Business customer deactivated")
