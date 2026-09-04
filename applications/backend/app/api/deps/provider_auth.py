"""Provider authentication dependency — Bearer token to authenticated provider."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header

from app.shared.exceptions.hierarchy import AuthenticationError


async def get_current_provider(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """Decode the Bearer access token and load the owning provider."""
    from app.startup.composition import get_composition

    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    composition = get_composition()
    try:
        claims = composition.jwt.decode(token)
    except Exception as exc:
        raise AuthenticationError("Invalid or expired token") from exc

    if claims.get("principal") != "PROVIDER":
        raise AuthenticationError("Token is not a provider token")

    provider = await composition.provider_account_repository.get_by_id(
        str(claims.get("sub", ""))
    )
    if not provider:
        raise AuthenticationError("Account no longer exists")
    return provider


CurrentProvider = Annotated[dict, Depends(get_current_provider)]