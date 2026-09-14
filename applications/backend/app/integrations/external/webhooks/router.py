"""Inbound webhook receivers (provider callbacks).

Security: signature verification happens BEFORE any business processing;
failures raise WebhookSignatureError (mapped to HTTP 400).
"""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any

from fastapi import APIRouter, Request

from app.integrations.external.exceptions.integration_errors import (
    WebhookSignatureError,
)

router = APIRouter(prefix="/webhooks", tags=["integrations"])


def _hmac_sha256_signature(secret: str, raw_body: bytes) -> str:
    """Compute X-SwalaSMS-Signature value for verification."""
    return hmac.new(
        secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256,
    ).hexdigest()


def _constant_time_eq(a: str, b: str) -> bool:
    return hmac.compare_digest(a, b)


@router.post("/integrations/swala/sms")
async def swala_sms_webhook(request: Request) -> dict[str, Any]:
    """Receive SwalaSMS delivery callbacks.

    Swala signs the raw request body with HMAC-SHA256 under
    X-SwalaSMS-Signature. Verification must use the raw bytes, not a
    re-serialized JSON payload.
    """
    raw_body = await request.body()
    provided = request.headers.get("X-SwalaSMS-Signature", "")
    webhook_secret = getattr(request.app, "state", {}).get("swala_sms_webhook_secret", "")
    if not webhook_secret and hasattr(request.app, "extra"):
        webhook_secret = request.app.extra.get("swala_sms_webhook_secret", "") or webhook_secret
    if not webhook_secret:
        raise WebhookSignatureError(
            "SwalaSMS webhook secret not configured on application",
            code="INTEGRATION.SWALA_WEBHOOK_SECRET_MISSING",
        )
    expected = _hmac_sha256_signature(webhook_secret, raw_body)
    if not _constant_time_eq(provided, expected):
        raise WebhookSignatureError(
            "SwalaSMS webhook signature mismatch",
            code="INTEGRATION.SWALA_WEBHOOK_SIGNATURE_MISMATCH",
        )
    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise WebhookSignatureError(
            "SwalaSMS webhook body could not be parsed",
            code="INTEGRATION.SWALA_WEBHOOK_INVALID_BODY",
            details={"error": str(exc)},
        )
    event = data.get("event")
    message_id = data.get("message_id") or data.get("messageUid") or data.get("uid")
    if not message_id or not event:
        raise WebhookSignatureError(
            "SwalaSMS webhook missing message_id/event",
            code="INTEGRATION.SWALA_WEBHOOK_MISSING_FIELDS",
        )
    if event not in ("sms.delivered", "sms.failed"):
        return {"received": True, "event": event, "message_id": message_id}
    # TODO(swala): persist/enqueue delivery update keyed by message_id+event.
    return {"received": True, "event": event, "message_id": message_id}
