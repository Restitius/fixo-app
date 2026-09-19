"""Provider auth router — register / OTP / login / refresh / me (Requirement Phase 1).

Mounted alongside the customer /providers directory router (same prefix,
different sub-paths) under /providers/auth.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Header
from pydantic import BaseModel, EmailStr, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/auth", tags=["providers"])


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    middle_name: str = Field(default="", max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    display_name: str | None = Field(default=None, max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=20)
    password: str = Field(min_length=8, max_length=128)
    account_type: str = "INDIVIDUAL"
    country: str | None = Field(default=None, max_length=80)
    region: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=80)
    district: str | None = Field(default=None, max_length=80)
    preferred_language: str = "en"
    referral_code: str | None = Field(default=None, max_length=40)
    terms_accepted: bool
    privacy_accepted: bool


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_info: str = ""


class OtpRequestRequest(BaseModel):
    email: EmailStr


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)
    new_password: str = Field(min_length=8)


@router.post("/register", status_code=201)
async def register(payload: RegisterRequest) -> dict:
    svc = get_composition().provider_auth_service()
    return ok(await svc.register(payload.model_dump()), title="Provider registered", status_code=201)


@router.post("/login")
async def login(
    payload: LoginRequest,
    x_forwarded_for: Annotated[str | None, Header()] = None,
) -> dict:
    ip = (x_forwarded_for or "").split(",")[0].strip()
    svc = get_composition().provider_auth_service()
    return ok(await svc.login(payload.email, payload.password, payload.device_info, ip))


@router.post("/otp/request")
async def request_otp(payload: OtpRequestRequest) -> dict:
    return ok(await get_composition().provider_auth_service().request_otp(payload.email))


@router.post("/otp/verify")
async def verify_otp(payload: OtpVerifyRequest) -> dict:
    svc = get_composition().provider_auth_service()
    return ok(await svc.verify_otp(payload.email, payload.code), title="Verified")


@router.post("/password/forgot")
async def forgot_password(payload: ForgotPasswordRequest) -> dict:
    return ok(await get_composition().provider_auth_service().request_password_reset(payload.email))


@router.post("/password/reset")
async def reset_password(payload: ResetPasswordRequest) -> dict:
    svc = get_composition().provider_auth_service()
    return ok(
        await svc.reset_password(payload.email, payload.code, payload.new_password),
        title="Password reset",
    )


@router.post("/token/refresh")
async def refresh_token(payload: RefreshRequest) -> dict:
    return ok(await get_composition().provider_auth_service().refresh(payload.refresh_token))


@router.get("/me")
async def me(provider: CurrentProvider) -> dict:
    return ok(provider)


@router.post("/logout")
async def logout(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_auth_service()
    await svc.logout(str(provider["provider_id"]))
    return ok({"success": True}, title="Logged out")