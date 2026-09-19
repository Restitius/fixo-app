"""Provider payout management router (Phase 30).

Prefix: /providers/me/payouts

- POST   /methods                 register a payout method
- GET    /methods                 list payout methods
- POST   /methods/{id}/default    set a method as default
- DELETE /methods/{id}            remove a payout method
- POST   /withdraw                request a withdrawal (wallet -> payout)
- GET    /                        list payouts
- GET    /{payout_id}             one payout
- POST   /{payout_id}/cancel      cancel a REQUESTED payout (release funds)
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_payout_service import (
    ProviderPayoutService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/payouts", tags=["provider-payouts"])


def _service() -> ProviderPayoutService:
    return get_composition().provider_payout_service()


class AddMethodBody(BaseModel):
    method_type: str = Field(..., min_length=1, max_length=20)
    provider_name: str | None = Field(None, max_length=80)
    account_holder: str | None = Field(None, max_length=120)
    account_number: str | None = Field(None, max_length=40)
    mobile_number: str | None = Field(None, max_length=20)
    currency: str = Field("TZS", min_length=3, max_length=3)
    is_default: bool = False


class WithdrawBody(BaseModel):
    method_id: str
    amount: float = Field(..., gt=0)
    currency: str = Field("TZS", min_length=3, max_length=3)


@router.post("/methods", status_code=201)
async def add_method(body: AddMethodBody, provider: dict = Depends(get_current_provider)) -> dict[str, Any]:
    svc = _service()
    return ok(
        await svc.add_method(
            str(provider["provider_id"]),
            method_type=body.method_type,
            provider_name=body.provider_name,
            account_holder=body.account_holder,
            account_number=body.account_number,
            mobile_number=body.mobile_number,
            currency=body.currency,
            is_default=body.is_default,
        )
    )


@router.get("/methods")
async def list_methods(provider: dict = Depends(get_current_provider)) -> list[dict[str, Any]]:
    return ok(await _service().list_methods(str(provider["provider_id"])))


@router.post("/methods/{method_id}/default")
async def set_default_method(
    method_id: str, provider: dict = Depends(get_current_provider)
) -> dict[str, Any]:
    return ok(await _service().set_default_method(str(provider["provider_id"]), method_id))


@router.delete("/methods/{method_id}")
async def delete_method(method_id: str, provider: dict = Depends(get_current_provider)) -> dict[str, Any]:
    return ok(await _service().delete_method(str(provider["provider_id"]), method_id))


@router.post("/withdraw", status_code=201)
async def withdraw(body: WithdrawBody, provider: dict = Depends(get_current_provider)) -> dict[str, Any]:
    svc = _service()
    return ok(
        await svc.withdraw(
            str(provider["provider_id"]),
            method_id=body.method_id,
            amount=body.amount,
            currency=body.currency,
        )
    )


@router.get("")
async def list_payouts(
    limit: int = 20,
    offset: int = 0,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    return ok(await _service().list(str(provider["provider_id"]), limit=limit, offset=offset))


@router.get("/{payout_id}")
async def get_payout(payout_id: str, provider: dict = Depends(get_current_provider)) -> dict[str, Any]:
    return ok(await _service().get(str(provider["provider_id"]), payout_id))


@router.post("/{payout_id}/cancel")
async def cancel_payout(payout_id: str, provider: dict = Depends(get_current_provider)) -> dict[str, Any]:
    return ok(await _service().cancel(str(provider["provider_id"]), payout_id))
