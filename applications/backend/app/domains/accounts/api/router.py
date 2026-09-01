"""Accounts domain router — Modules 43-50 (profile / payment methods / preferences / security / privacy)."""
from __future__ import annotations
from typing import Any

from fastapi import APIRouter, Body, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/account", tags=["account"])


class PreferenceSetRequest(BaseModel):
    key: str = Field(..., min_length=1, max_length=80)
    value: str = Field(..., min_length=1, max_length=1000)


class PaymentMethodAddRequest(BaseModel):
    type: str = Field(..., description="card|mpesa|bank")
    provider: str | None = None
    details_masked: dict[str, Any] = Field(...)
    make_default: bool | None = False


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class ConsentSetRequest(BaseModel):
    kind: str = Field(..., description="MARKETING|ANALYTICS|COMMUNICATION")
    consented: bool = True


@router.get("/preferences")
async def list_preferences(customer: CurrentCustomer) -> dict:
    svc = get_composition().preference_service()
    return ok(await svc.list(str(customer["customer_id"])))


@router.post("/preferences")
async def set_preference(payload: PreferenceSetRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().preference_service()
    return ok(await svc.set(str(customer["customer_id"]), payload.key, payload.value), title="Preference updated")


@router.get("/payment-methods")
async def list_payment_methods(
    customer: CurrentCustomer,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().payment_method_service()
    return ok(await svc.list(str(customer["customer_id"]), limit=limit, offset=offset))


@router.post("/payment-methods")
async def add_payment_method(payload: PaymentMethodAddRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().payment_method_service()
    method = await svc.add(str(customer["customer_id"]), payload.type, payload.provider, payload.details_masked)
    if payload.make_default:
        method = await svc.set_default(str(customer["customer_id"]), str(method["method_id"])) or method
    return ok(method, title="Payment method added", status_code=201)


@router.post("/payment-methods/{method_id}/set-default")
async def set_default_payment(method_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().payment_method_service()
    return ok(await svc.set_default(str(customer["customer_id"]), method_id), title="Default updated")


@router.delete("/payment-methods/{method_id}")
async def delete_payment_method(method_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().payment_method_service()
    await svc.remove(str(customer["customer_id"]), method_id)
    return ok(None, title="Payment method removed")


@router.post("/security/change-password")
async def change_password(payload: ChangePasswordRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().security_service()
    await svc.change_password(str(customer["customer_id"]), payload.current_password, payload.new_password)
    return ok(None, title="Password updated")


@router.post("/security/revoke-sessions")
async def revoke_sessions(customer: CurrentCustomer, reason: str = Body("security", embed=True)) -> dict:
    svc = get_composition().security_service()
    return ok(await svc.revoke_all_sessions(str(customer["customer_id"]), reason), title="Sessions revoked")


@router.get("/security/sessions")
async def list_sessions(customer: CurrentCustomer) -> dict:
    svc = get_composition().security_service()
    return ok(await svc.list_sessions(str(customer["customer_id"])))


@router.get("/consents")
async def list_consents(customer: CurrentCustomer) -> dict:
    svc = get_composition().privacy_service()
    return ok(await svc.list_consents(str(customer["customer_id"])))


@router.post("/consents")
async def set_consent(payload: ConsentSetRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().privacy_service()
    return ok(await svc.set_consent(str(customer["customer_id"]), payload.kind, payload.consented), title="Consent updated")


@router.post("/privacy/export")
async def request_export(customer: CurrentCustomer) -> dict:
    svc = get_composition().privacy_service()
    return ok(await svc.request_export(str(customer["customer_id"])), title="Export requested")


@router.get("/privacy/exports")
async def list_exports(
    customer: CurrentCustomer,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().privacy_service()
    return ok(await svc.list_exports(str(customer["customer_id"]), limit=limit, offset=offset))


@router.post("/closure")
async def schedule_closure(customer: CurrentCustomer) -> dict:
    svc = get_composition().account_closure_service()
    return ok(await svc.schedule_closure(str(customer["customer_id"])), title="Account closure scheduled")