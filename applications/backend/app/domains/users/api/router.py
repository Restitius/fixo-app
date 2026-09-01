"""Users router — declares endpoints; logic lives in the controller."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.request_context import GetRequestContext
from app.domains.users.api.controller import UserController

from app.domains.users.requests.create_user import CreateUserRequest as UserCreateRequest
from app.domains.users.requests.update_user import UpdateUserRequest as UserUpdateRequest
from app.domains.users.requests.change_password_user import ChangePasswordUserRequest as UserChangePasswordRequest
from app.domains.users.requests.deactivate_user import DeactivateUserRequest as UserDeactivateRequest

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", status_code=201)
async def create(payload: UserCreateRequest, ctx=GetRequestContext) -> dict:
    """USERS create endpoint -> UserController.Create."""
    return await UserController.Create(payload, ctx)

@router.patch("/{user_id}", status_code=200)
async def update(user_id: int, payload: UserUpdateRequest, ctx=GetRequestContext) -> dict:
    """USERS update endpoint -> UserController.Update."""
    return await UserController.Update(user_id, payload, ctx)

@router.post("/{user_id}/password", status_code=201)
async def change_password(user_id: int, payload: UserChangePasswordRequest, ctx=GetRequestContext) -> dict:
    """USERS change_password endpoint -> UserController.Change_password."""
    return await UserController.Change_password(user_id, payload, ctx)

@router.post("/{user_id}/deactivate", status_code=201)
async def deactivate(user_id: int, payload: UserDeactivateRequest, ctx=GetRequestContext) -> dict:
    """USERS deactivate endpoint -> UserController.Deactivate."""
    return await UserController.Deactivate(user_id, payload, ctx)
