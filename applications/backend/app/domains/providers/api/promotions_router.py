"""Provider promotions router - Phase 48.

Prefix: /providers/me/promotions
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/promotions", tags=["provider-promotions"])


class CreatePromotionRequest(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    discount_type: str = "PERCENT"
    discount_value: float = Field(ge=0)
    min_amount: float = Field(default=0, ge=0)
    max_discount: float | None = Field(default=None, ge=0)
    usage_limit: int | None = Field(default=None, ge=1)
    valid_from: datetime
    valid_until: datetime


class UpdatePromotionRequest(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    discount_type: str | None = None
    discount_value: float | None = Field(default=None, ge=0)
    min_amount: float | None = Field(default=None, ge=0)
    max_discount: float | None = Field(default=None, ge=0)
    usage_limit: int | None = Field(default=None, ge=1)
    valid_from: datetime | None = None
    valid_until: datetime | None = None


class ValidatePromotionRequest(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    amount: float = Field(ge=0)


@router.post("/", status_code=201)
async def create_promotion(payload: CreatePromotionRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_promotions_service()
    record = await svc.create(
        str(provider["provider_id"]),
        code=payload.code,
        name=payload.name,
        description=payload.description,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_amount=payload.min_amount,
        max_discount=payload.max_discount,
        usage_limit=payload.usage_limit,
        valid_from=payload.valid_from,
        valid_until=payload.valid_until,
    )
    return ok(record, title="Promotion created", status_code=201)


@router.get("/")
async def list_promotions(
    provider: CurrentProvider,
    active: bool | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_promotions_service()
    return ok(
        await svc.list_promotions(str(provider["provider_id"]), active=active, limit=limit, offset=offset)
    )


@router.get("/{promo_id}")
async def get_promotion(promo_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_promotions_service()
    return ok(await svc.get(str(provider["provider_id"]), promo_id=promo_id))


@router.patch("/{promo_id}")
async def update_promotion(
    promo_id: str, payload: UpdatePromotionRequest, provider: CurrentProvider
) -> dict:
    svc = get_composition().provider_promotions_service()
    record = await svc.update(
        str(provider["provider_id"]),
        promo_id=promo_id,
        name=payload.name,
        description=payload.description,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_amount=payload.min_amount,
        max_discount=payload.max_discount,
        usage_limit=payload.usage_limit,
        valid_from=payload.valid_from,
        valid_until=payload.valid_until,
    )
    return ok(record, title="Promotion updated")


@router.post("/{promo_id}/deactivate")
async def deactivate_promotion(promo_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_promotions_service()
    result = await svc.deactivate(str(provider["provider_id"]), promo_id=promo_id)
    return ok(result, title="Promotion deactivated")


@router.post("/validate")
async def validate_promotion(payload: ValidatePromotionRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_promotions_service()
    result = await svc.validate_code(
        str(provider["provider_id"]), code=payload.code, amount=payload.amount
    )
    return ok(result)


@router.post("/{promo_id}/redeem")
async def redeem_promotion(promo_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_promotions_service()
    result = await svc.redeem(str(provider["provider_id"]), promo_id=promo_id)
    return ok(result, title="Promotion redeemed")
