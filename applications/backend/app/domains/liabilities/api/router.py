"""Liabilitys router — declares endpoints; logic lives in the controller."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.request_context import GetRequestContext
from app.domains.liabilities.api.controller import LiabilityController
from app.domains.liabilities.requests.create_liability import CreateLiabilityRequest as LiabilityCreateRequest
from app.domains.liabilities.requests.record_payment_liability import (
    RecordPaymentLiabilityRequest as LiabilityRecordPaymentRequest,
)
from app.domains.liabilities.requests.restructure_liability import (
    RestructureLiabilityRequest as LiabilityRestructureRequest,
)
from app.domains.liabilities.requests.update_liability import UpdateLiabilityRequest as LiabilityUpdateRequest

router = APIRouter(prefix="/liabilities", tags=["liabilities"])

@router.post("", status_code=201)
async def create(payload: LiabilityCreateRequest, ctx=GetRequestContext) -> dict:
    """LIABILITIES create endpoint -> LiabilityController.Create."""
    return await LiabilityController.Create(payload, ctx)

@router.patch("/{liability_id}", status_code=200)
async def update(liability_id: int, payload: LiabilityUpdateRequest, ctx=GetRequestContext) -> dict:
    """LIABILITIES update endpoint -> LiabilityController.Update."""
    return await LiabilityController.Update(liability_id, payload, ctx)

@router.post("/{liability_id}/restructure", status_code=201)
async def restructure(liability_id: int, payload: LiabilityRestructureRequest, ctx=GetRequestContext) -> dict:
    """LIABILITIES restructure endpoint -> LiabilityController.Restructure."""
    return await LiabilityController.Restructure(liability_id, payload, ctx)

@router.post("/{liability_id}/payments", status_code=201)
async def record_payment(liability_id: int, payload: LiabilityRecordPaymentRequest, ctx=GetRequestContext) -> dict:
    """LIABILITIES record_payment endpoint -> LiabilityController.Record_payment."""
    return await LiabilityController.Record_payment(liability_id, payload, ctx)
