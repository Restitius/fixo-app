"""Authentication dependency — Bearer token to authenticated customer."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header

from app.security.authentication import Principal
from app.shared.exceptions.hierarchy import AuthenticationError, NotImplementedFeatureError


async def get_current_customer(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """Decode the Bearer access token and load the owning customer."""
    from app.startup.composition import get_composition

    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    composition = get_composition()
    try:
        claims = composition.jwt.decode(token)
    except Exception as exc:  # jwt.AuthenticationError or config issues
        raise AuthenticationError("Invalid or expired token") from exc

    customer = await composition.customer_repository.get_by_id(str(claims.get("sub", "")))
    if not customer:
        raise AuthenticationError("Account no longer exists")
    return customer


CurrentCustomer = Annotated[dict, Depends(get_current_customer)]


async def get_current_principal(
    authorization: Annotated[str | None, Header()] = None,
) -> Principal:
    """Legacy principal dependency (scaffold) — kept for existing imports."""
    raise NotImplementedFeatureError("Principal-based authorization lands with roles")
