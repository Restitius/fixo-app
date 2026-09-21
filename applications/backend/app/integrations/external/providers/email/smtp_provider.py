"""SmtpEmailProvider — transactional email over plain SMTP.

Uses the stdlib smtplib (wrapped in asyncio.to_thread since smtplib is
synchronous) rather than an HTTP-based provider, since EMAIL_PRIMARY_HOST/
USER/PASSWORD in .env.example are raw SMTP credentials, not an HTTP API key.
Ships registered but disabled (INT.EMAIL.TRANSACTIONAL.V1 enabled=False)
until real credentials are supplied — see register_integrations.py.
"""
from __future__ import annotations

import asyncio
import smtplib
from email.mime.text import MIMEText
from typing import Any

from app.integrations.external.contracts.email_provider import EmailProvider, MessageReceipt
from app.integrations.external.exceptions.integration_errors import (
    CredentialsMissingError,
    ProviderRejectedError,
)


class SmtpEmailProvider(EmailProvider):
    """Transactional email over SMTP (STARTTLS)."""

    def _config(self) -> tuple[str, int, str, str, str]:
        host = self.secret("EMAIL_PRIMARY_HOST", required=True)
        port = int(self.optional_secret("EMAIL_PRIMARY_PORT") or "587")
        user = self.secret("EMAIL_PRIMARY_USER", required=True)
        password = self.secret("EMAIL_PRIMARY_PASSWORD", required=True)
        from_address = self.optional_secret("EMAIL_PRIMARY_FROM") or user
        return host, port, user, password, from_address

    async def health(self) -> bool:
        """Cheap liveness probe: connect + STARTTLS + auth, then quit."""
        try:
            host, port, user, password, _ = self._config()
        except Exception:
            return False

        def _probe() -> bool:
            with smtplib.SMTP(host, port, timeout=10) as client:
                client.starttls()
                client.login(user, password)
            return True

        try:
            return await asyncio.to_thread(_probe)
        except Exception:
            return False

    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: bool = False,
        cc: list[str] | None = None,
        attachments: list[dict] | None = None,
    ) -> MessageReceipt:
        try:
            host, port, user, password, from_address = self._config()
        except Exception as exc:
            raise CredentialsMissingError(str(exc)) from exc

        message = MIMEText(body, "html" if html else "plain")
        message["Subject"] = subject
        message["From"] = from_address
        message["To"] = to
        if cc:
            message["Cc"] = ", ".join(cc)
        recipients = [to, *(cc or [])]

        def _send() -> None:
            with smtplib.SMTP(host, port, timeout=10) as client:
                client.starttls()
                client.login(user, password)
                client.sendmail(from_address, recipients, message.as_string())

        try:
            await asyncio.to_thread(_send)
        except smtplib.SMTPException as exc:
            raise ProviderRejectedError(f"SMTP send failed: {exc}") from exc

        return MessageReceipt(provider_message_id=message.get("Message-ID") or "", accepted=True)

    async def execute(self, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        if operation == "send":
            receipt = await self.send_email(
                to=payload["to"],
                subject=payload["subject"],
                body=payload["body"],
            )
            return {
                "message_id": receipt.provider_message_id,
                "accepted": receipt.accepted,
            }
        raise NotImplementedError(f"SmtpEmailProvider operation={operation}")
