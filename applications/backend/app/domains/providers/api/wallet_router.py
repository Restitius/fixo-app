"""Provider wallet router (Phase 29).

Prefix: /providers/me/wallet

- GET /                 wallet overview (available / pending / reserved /
                        withdrawals / refund deductions / bonuses / adjustments)
- GET /transactions     the full wallet transaction history (newest first)
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.api.deps.provider_auth import get_current_provider
from app.api.responses.response import ok
from app.domains.providers.services.provider_wallet_service import (
    ProviderWalletService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/wallet", tags=["provider-wallet"])


def _service() -> ProviderWalletService:
    return get_composition().provider_wallet_service()


@router.get("")
async def wallet_overview(
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    svc = _service()
    return ok(await svc.overview(provider_id=str(provider["provider_id"])))


@router.get("/transactions")
async def wallet_transactions(
    limit: int = 20,
    offset: int = 0,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    svc = _service()
    return ok(
        await svc.transactions(
            provider_id=str(provider["provider_id"]),
            limit=limit,
            offset=offset,
        )
    )
