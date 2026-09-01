"""Inbound webhook receivers (provider callbacks).

Security: signature verification happens BEFORE any business processing;
failures raise WebhookSignatureError (mapped to HTTP 400).
"""
from __future__ import annotations

from fastapi import APIRouter, Request

from app.shared.exceptions.hierarchy import NotImplementedFeatureError

router = APIRouter(prefix="/webhooks", tags=["integrations"])


@router.post("/payments")
async def payments_webhook(request: Request) -> dict:
    """Receive payment gateway callbacks (signature check + normalization)."""
    raise NotImplementedFeatureError("Payments webhook processing not implemented yet")


@router.post("/banks")
async def banks_webhook(request: Request) -> dict:
    raise NotImplementedFeatureError("Bank webhook processing not implemented yet")
