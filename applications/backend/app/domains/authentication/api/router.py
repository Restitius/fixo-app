"""Authentication router — register / login / OTP / refresh / me."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, EmailStr, Field

from app.api.responses.response import ok
from app.api.deps.auth import CurrentCustomer
from app.startup.composition import get_composition

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=20)
    email: EmailStr
    password: str = Field(min_length=8)
    preferred_language: str = "en"
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


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=7, max_length=20)
    preferred_language: str | None = None


@router.post("/register", status_code=201)
async def register(payload: RegisterRequest) -> dict:
    svc = get_composition().auth_service()
    return ok(await svc.register(payload.model_dump()), title="Welcome", status_code=201)


@router.post("/login")
async def login(
    payload: LoginRequest,
    x_forwarded_for: Annotated[str | None, Header()] = None,
) -> dict:
    ip = (x_forwarded_for or "").split(",")[0].strip()
    svc = get_composition().auth_service()
    return ok(await svc.login(payload.email, payload.password, payload.device_info, ip))


@router.post("/otp/request")
async def request_otp(payload: OtpRequestRequest) -> dict:
    return ok(await get_composition().auth_service().request_otp(payload.email))


@router.post("/otp/verify")
async def verify_otp(payload: OtpVerifyRequest) -> dict:
    return ok(
        await get_composition().auth_service().verify_otp(payload.email, payload.code),
        title="Verified",
    )


@router.post("/password/forgot")
async def forgot_password(payload: ForgotPasswordRequest) -> dict:
    return ok(await get_composition().auth_service().request_password_reset(payload.email))


@router.post("/password/reset")
async def reset_password(payload: ResetPasswordRequest) -> dict:
    svc = get_composition().auth_service()
    return ok(
        await svc.reset_password(payload.email, payload.code, payload.new_password),
        title="Password reset",
    )


@router.post("/token/refresh")
async def refresh_token(payload: RefreshRequest) -> dict:
    return ok(await get_composition().auth_service().refresh(payload.refresh_token))


@router.get("/me")
async def me(customer: CurrentCustomer) -> dict:
    return ok(customer)


@router.patch("/me")
async def update_me(payload: UpdateProfileRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().auth_service()
    updated = await svc.update_profile(str(customer["customer_id"]), payload.model_dump(exclude_unset=True))
    return ok(updated, title="Profile updated")


@router.post("/logout")
async def logout(customer: CurrentCustomer) -> dict:
    # Revoke all active sessions for this customer.
    svc = get_composition().auth_service()
    await svc.logout(customer["customer_id"])
    return ok({"success": True}, title="Logged out")

