"""SwalaSMS provider implementation for FIXO transactional SMS."""
from __future__ import annotations

import re
from typing import Any

from app.integrations.external.clients.http_client import HttpClient
from app.integrations.external.contracts.messaging_provider import MessagingProvider
from app.integrations.external.exceptions.integration_errors import (
    CredentialsMissingError,
    ProviderRateLimitedError,
    ProviderRejectedError,
)
from app.registries.integrations.integration_definition import IntegrationDefinition


class SwalaSmsProvider(MessagingProvider):
    """SwalaSMS transactional SMS provider.

    Docs/behavior assumptions are implemented here so domain code never
    needs to know Swala-specific HTTP rules.
    """

    E164_RE = re.compile(r"^\+[1-9]\d{1,14}$")

    def __init__(self, definition: IntegrationDefinition, client: HttpClient | None = None) -> None:
        super().__init__(definition, client=client)
        self._base_url = self.definition.base_url_env or "https://swalasms.com/api/v1"
        self._sender_id: str | None = None

    def _client(self, timeout_seconds: float) -> HttpClient:
        if self.client is not None:
            return self.client
        base_url = self._resolve_base_url()
        return HttpClient(
            base_url=base_url,
            timeout_seconds=timeout_seconds,
            default_headers={
                "accept": "application/json",
                "content-type": "application/json",
            },
        )

    def _resolve_base_url(self) -> str:
        from app.config import get_settings

        settings = get_settings()
        base_url = str(settings.swala_sms_base_url).strip()
        if not base_url:
            base_url = "https://swalasms.com/api/v1"
        if not base_url.startswith(("http://", "https://")):
            base_url = "https://" + base_url.lstrip("/")
        return base_url.rstrip("/")

    async def health(self) -> bool:
        """Cheap liveness probe via GET /sms/profile."""
        api_key = self.secret("SWALA_SMS_API_KEY", required=True)
        client = self._client(timeout_seconds=10.0)
        response = await client.request(
            "GET", "/sms/profile", headers={"authorization": f"Bearer {api_key}"}
        )
        if response.status == 200:
            return True
        return False

    async def send_sms(
        self,
        *,
        to: str,
        text: str,
        reference: str | None = None,
        notification_id: str | None = None,
    ) -> dict[str, Any]:
        api_key = self.secret("SWALA_SMS_API_KEY", required=True)
        sender_id = self.optional_secret("SWALA_SMS_SENDER_ID") or "FIXO"

        if not self.E164_RE.match(to):
            raise ProviderRejectedError(
                f"Invalid recipient address: {to}",
                code="INTEGRATION.SWALA_INVALID_RECIPIENT",
                details={"recipient": to},
            )

        if not text:
            raise ProviderRejectedError(
                "SMS body must not be empty",
                code="INTEGRATION.SWALA_EMPTY_BODY",
                details={"recipient": to},
            )

        idempotency_key = self._idempotency_key(notification_id=notification_id, reference=reference, recipient=to)

        payload = {
            "recipient": to,
            "sender_id": sender_id,
            "body": text,
        }
        if reference:
            payload["reference"] = reference

        client = self._client(timeout_seconds=10.0)
        headers = {"authorization": f"Bearer {api_key}", "idempotency-key": idempotency_key}

        response = await client.request("POST", "/sms/messages", json_payload=payload, headers=headers)
        return self._interpret_send_response(to=to, response=response, idempotency_key=idempotency_key)

    async def publish(self, topic: str, payload: dict[str, Any], *, key: str | None = None) -> dict[str, Any]:
        raise NotImplementedError("SwalaSmsProvider.publish")

    @staticmethod
    def _idempotency_key(*, notification_id: str | None, reference: str | None, recipient: str) -> str:
        # No phone-number-only fallback: two distinct notifications to the
        # same number must never collide on the same idempotency key. Every
        # caller in the notification catalogue passes notification_id (the
        # outbox row id), so this only fires for a caller that skipped that
        # contract — which is a bug at the call site, not something to paper
        # over with a weaker key.
        if notification_id:
            return f"fixo:{notification_id}:sms"
        if reference:
            return f"fixo:{reference}:sms"
        raise ProviderRejectedError(
            "send_sms requires notification_id or reference for a stable idempotency key",
            code="INTEGRATION.SWALA_MISSING_IDEMPOTENCY_INPUT",
            details={"recipient": recipient},
        )

    @staticmethod
    def _interpret_send_response(*, to: str, response: Any, idempotency_key: str) -> dict[str, Any]:
        status = getattr(response, "status", None)
        body = getattr(response, "json", lambda: None)() or {}

        if status == 409:
            raise ProviderRejectedError(
                "Idempotency conflict: reuse of key with different payload",
                code="INTEGRATION.SWALA_IDEMPOTENCY_CONFLICT",
                details={"recipient": to, "idempotency_key": idempotency_key},
            )

        if status in (400, 422):
            raise ProviderRejectedError(
                f"Provider rejected request: {status}",
                code="INTEGRATION.SWALA_REQUEST_REJECTED",
                details={"recipient": to, "status": status, "response": body},
            )

        if status == 401:
            raise CredentialsMissingError(
                "Swala SMS authentication failed",
                code="INTEGRATION.SWALA_AUTH_FAILED",
                details={"recipient": to},
            )

        if status == 429:
            raise ProviderRateLimitedError(
                "Swala SMS rate limit exceeded",
                code="INTEGRATION.SWALA_RATE_LIMITED",
                details={"recipient": to},
            )

        if status >= 400:
            raise ProviderRejectedError(
                f"Swala SMS provider error: {status}",
                code="INTEGRATION.SWALA_PROVIDER_ERROR",
                details={"recipient": to, "status": status, "response": body},
            )

        request_uid = body.get("request_uid") or body.get("requestUid") or None
        message_uid = body.get("data", {}).get("uid") or body.get("uid") or None

        return {
            "provider": "swala",
            "provider_message_uid": message_uid,
            "provider_request_uid": request_uid,
            "idempotency_key": idempotency_key,
            "recipient_e164": to,
            "status": "QUEUED",
            "http_status": status,
        }
