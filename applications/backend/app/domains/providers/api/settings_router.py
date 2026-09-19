"""Provider settings router - Phase 50 (notifications preferences, security,
privacy) and Phase 54 (account closure).

Prefix: /providers/me/settings

Personal/business info editing already exists under
/providers/me/profile and /providers/me/business (provider_profile_service
/ provider_business_service) and is untouched by this phase.
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/settings", tags=["provider-settings"])


class SetPreferenceRequest(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    value: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class SetConsentRequest(BaseModel):
    kind: str
    consented: bool


@router.get("/preferences")
async def list_preferences(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_preference_service()
    return ok(await svc.list(str(provider["provider_id"])))


@router.put("/preferences")
async def set_preference(payload: SetPreferenceRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_preference_service()
    result = await svc.set(str(provider["provider_id"]), payload.key, payload.value)
    return ok(result, title="Preference saved")


@router.post("/security/change-password")
async def change_password(payload: ChangePasswordRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_security_service()
    await svc.change_password(
        str(provider["provider_id"]), payload.current_password, payload.new_password
    )
    return ok({"changed": True}, title="Password changed")


@router.post("/security/revoke-sessions")
async def revoke_sessions(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_security_service()
    result = await svc.revoke_all_sessions(str(provider["provider_id"]))
    return ok(result, title="All sessions revoked")


@router.get("/privacy/consents")
async def list_consents(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_privacy_service()
    return ok(await svc.list_consents(str(provider["provider_id"])))


@router.put("/privacy/consents")
async def set_consent(payload: SetConsentRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_privacy_service()
    result = await svc.set_consent(str(provider["provider_id"]), payload.kind, payload.consented)
    return ok(result, title="Consent updated")


@router.post("/privacy/export-requests", status_code=201)
async def request_export(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_privacy_service()
    result = await svc.request_export(str(provider["provider_id"]))
    return ok(result, title="Data export requested", status_code=201)


@router.get("/privacy/export-requests")
async def list_exports(
    provider: CurrentProvider,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_privacy_service()
    return ok(await svc.list_exports(str(provider["provider_id"]), limit=limit, offset=offset))


@router.post("/closure")
async def schedule_closure(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_account_closure_service()
    return ok(
        await svc.schedule_closure(str(provider["provider_id"])),
        title="Account closure scheduled",
    )
