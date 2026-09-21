"""Provider documents & compliance router - Phase 47.

Prefix: /providers/me/compliance

Extends the existing Phase 5 verification system (same
PROVIDER_VERIFICATION_DOCUMENTS table, no new table) with a
compliance-monitoring view: which verified documents are nearing or
past expiry. Document upload/review/status stays under
/providers/verification (ProviderVerificationService), reused here
rather than duplicated.
"""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/compliance", tags=["provider-compliance"])


@router.get("/documents/expiring")
async def list_expiring_documents(
    provider: CurrentProvider,
    within_days: int = Query(30, ge=1, le=365),
) -> dict:
    svc = get_composition().provider_verification_service()
    return ok(
        await svc.expiring_documents(str(provider["provider_id"]), within_days=within_days)
    )
