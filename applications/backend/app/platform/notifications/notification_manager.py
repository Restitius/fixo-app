"""NotificationManager — the notification catalogue's single write/dispatch surface.

Two roles:

  1. Customer notification-center reads (list/mark_read/mark_all/unread_count) —
     unchanged from before the catalogue existed.
  2. notify() + process_pending() — the outbox-backed delivery pipeline. Most
     call-sites write their own NOTIFICATION_OUTBOX row atomically (via a CTE
     in their own governed query, alongside the business state change);
     notify() exists for the handful of sites whose underlying write is a
     generic, multi-purpose query where embedding a notification-specific CTE
     would be wrong (see the migration notes on booking payment-authorization
     and on-the-way — both flow through the shared CUS.BOOKING.SET_STATUS
     query). Either way, everything downstream of an outbox row — rendering,
     channels, retries, delivery-attempt tracking — is identical.

Platform layer: owns CUS.NOTIFICATIONS.*/PROV.NOTIFICATIONS.*/NTF.* execution
through SQLQueryManager (managers may touch registries + infrastructure
directly). Domains request notifications via this manager; they never see SQL
or IDs.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from app.jobs.retry import RetryPolicy, compute_backoff, should_retry
from app.platform.query.sql_query_manager import SQLQueryManager

logger = logging.getLogger(__name__)


class NotificationQueryIds:
    CREATE = "CUS.NOTIFICATIONS.CREATE"
    LIST = "CUS.NOTIFICATIONS.LIST"
    MARK_READ = "CUS.NOTIFICATIONS.MARK_READ"
    MARK_ALL = "CUS.NOTIFICATIONS.MARK_ALL"
    UNREAD = "CUS.NOTIFICATIONS.UNREAD_COUNT"

    PROVIDER_CREATE = "PROV.NOTIFICATIONS.CREATE"

    OUTBOX_CREATE = "NTF.OUTBOX.CREATE"
    OUTBOX_CLAIM_PENDING = "NTF.OUTBOX.CLAIM_PENDING"
    OUTBOX_MARK_DISPATCHED = "NTF.OUTBOX.MARK_DISPATCHED"
    OUTBOX_MARK_FAILED = "NTF.OUTBOX.MARK_FAILED"

    DELIVERY_CREATE = "NTF.DELIVERY_ATTEMPTS.CREATE"
    DELIVERY_UPDATE_STATUS = "NTF.DELIVERY_ATTEMPTS.UPDATE_STATUS"
    DELIVERY_CLAIM_RETRY = "NTF.DELIVERY_ATTEMPTS.CLAIM_RETRY"
    DELIVERY_FIND_BY_CHANNEL = "NTF.DELIVERY_ATTEMPTS.FIND_BY_CHANNEL"
    DELIVERY_FIND_BY_REFERENCE = "NTF.DELIVERY_ATTEMPTS.FIND_BY_REFERENCE"

    WEBHOOK_RECEIPT_CREATE = "NTF.WEBHOOK_RECEIPTS.CREATE"

    CUSTOMER_LANGUAGE_GET = "NTF.CUSTOMER_LANGUAGE.GET"
    PROVIDER_LANGUAGE_GET = "NTF.PROVIDER_LANGUAGE.GET"

    CUSTOMER_PREFERENCE_LIST = "CUS.PREFERENCE.LIST"
    PROVIDER_PREFERENCE_LIST = "PROV.SETTINGS.PREFERENCE.LIST"


# recipient-facing default channel toggles, mirroring web-user's
# NOTIFY_DEFAULTS (profile.tsx) so a recipient with no explicit preference
# row gets the same default the frontend already shows them.
_DEFAULT_CHANNEL_ENABLED = {
    ("BOOKING_UPDATES", "EMAIL"): True,
    ("BOOKING_UPDATES", "SMS"): False,
    ("PAYMENT_RECEIPTS", "EMAIL"): True,
    ("PAYMENT_RECEIPTS", "SMS"): True,
}

# payload key -> (ref_type, in-app category) used when writing the "database"
# channel row, matching the ref_type conventions the 8 original ad-hoc
# notify() calls already used.
_REFERENCE_KEYS: tuple[tuple[str, str], ...] = (
    ("booking_id", "BOOKING"),
    ("request_id", "SERVICE_REQUEST"),
    ("quote_id", "QUOTATION"),
    ("change_id", "CHANGE_REQUEST"),
    ("review_id", "REVIEW"),
    ("doc_id", "VERIFICATION_DOCUMENT"),
    ("ticket_id", "SUPPORT_TICKET"),
    ("invoice_id", "INVOICE"),
    ("plan_id", "MAINTENANCE_PLAN"),
)


def _as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, str):
        return json.loads(value) if value else {}
    return dict(value or {})


def _derive_reference(payload: dict[str, Any]) -> tuple[str | None, str | None]:
    for key, ref_type in _REFERENCE_KEYS:
        if payload.get(key):
            return ref_type, str(payload[key])
    return None, None


class NotificationManager:
    def __init__(
        self,
        sql_manager: SQLQueryManager,
        *,
        notification_registry: Any = None,
        messaging: Any = None,
        retry_policy: RetryPolicy | None = None,
    ) -> None:
        self._sql = sql_manager
        self._registry = notification_registry
        self._messaging = messaging
        self._retry_policy = retry_policy or RetryPolicy()

    # -- production (called by domain flows via composition) -------------------

    async def notify(
        self,
        customer_id: str,
        *,
        ntype: str | None = None,
        title: str | None = None,
        body: str | None = None,
        ref_type: str | None = None,
        ref_id: Any | None = None,
    ) -> None:
        """Legacy direct-write path — kept only for any caller not yet on the
        catalogue. Prefer queue_notification()."""
        await self._sql.execute(
            NotificationQueryIds.CREATE,
            {
                "customer_id": customer_id,
                "type": ntype,
                "title": (title or "")[:160],
                "body": (body or "")[:500] or None,
                "ref_type": ref_type,
                "ref_id": str(ref_id) if ref_id else None,
                "outbox_id": None,
            },
            fetch="one",
        )

    async def queue_notification(
        self, recipient_type: str, recipient_id: str, *, key: str, data: dict[str, Any]
    ) -> str | None:
        """Write a durable NOTIFICATION_OUTBOX row for a catalogue key.

        Used by the handful of call-sites whose state-changing query is too
        generic to safely carry a notification-specific CTE (see module
        docstring). Everything else embeds this same insert directly in its
        own governed query for atomicity with the state change.
        """
        row = await self._sql.execute(
            NotificationQueryIds.OUTBOX_CREATE,
            {
                "event_key": key,
                "recipient_type": recipient_type,
                "recipient_id": recipient_id,
                "payload": json.dumps(data),
            },
            fetch="one",
        )
        return str(row["outbox_id"]) if row else None

    # -- scheduler-invoked drain (JOB.NOTIFICATIONS.DISPATCH) -------------------

    async def process_pending(self, batch: int = 50) -> dict[str, Any]:
        """Claim due outbox rows and deliver them across every catalogue channel."""
        claimed = await self._sql.execute(
            NotificationQueryIds.OUTBOX_CLAIM_PENDING, {"batch": batch}, fetch="all"
        )
        processed = 0
        failed = 0
        for row in claimed or []:
            try:
                await self._process_one(row)
                await self._sql.execute(
                    NotificationQueryIds.OUTBOX_MARK_DISPATCHED,
                    {"outbox_id": row["outbox_id"]},
                    fetch="one",
                )
                processed += 1
            except Exception as exc:  # noqa: BLE001 — one bad row must not stop the drain
                logger.warning("notification outbox %s failed: %s", row.get("outbox_id"), exc)
                await self._sql.execute(
                    NotificationQueryIds.OUTBOX_MARK_FAILED,
                    {"outbox_id": row["outbox_id"]},
                    fetch="one",
                )
                failed += 1
        retries = await self.process_retries(batch)
        return {"claimed": len(claimed or []), "processed": processed, "failed": failed, "retries": retries}

    async def process_retries(self, batch: int = 50) -> int:
        """Resume channel attempts whose backoff has elapsed."""
        rows = await self._sql.execute(
            NotificationQueryIds.DELIVERY_CLAIM_RETRY, {"batch": batch}, fetch="all"
        )
        for row in rows or []:
            try:
                definition = self._registry.get(row["event_key"])
                recipient_type = row["recipient_type"]
                contact = await self._recipient_contact(recipient_type, str(row["recipient_id"]))
                title, body = self._render(
                    definition,
                    row["event_key"],
                    recipient_type,
                    contact.get("preferred_language") or "en",
                    _as_dict(row.get("payload")),
                )
                await self._run_attempt(
                    str(row["attempt_id"]),
                    int(row["attempt_no"]),
                    row["channel"],
                    str(row["outbox_id"]),
                    contact,
                    title,
                    body,
                )
            except Exception as exc:  # keep a broken row from stopping other retries
                logger.exception("notification retry %s failed", row.get("attempt_id"))
                await self._record_attempt_failure(str(row["attempt_id"]), int(row["attempt_no"]), exc)
        return len(rows or [])

    async def _process_one(self, row: dict[str, Any]) -> None:
        key = row["event_key"]
        definition = self._registry.get(key)
        recipient_type = row["recipient_type"]
        recipient_id = str(row["recipient_id"])
        payload = _as_dict(row.get("payload"))
        outbox_id = str(row["outbox_id"])
        if recipient_type not in ("customer", "provider") or recipient_type not in definition.recipients:
            raise ValueError(f"{key} does not support recipient type {recipient_type}")
        missing = [field for field in definition.required_data if field not in payload]
        if missing:
            raise ValueError(f"{key} is missing payload fields: {', '.join(missing)}")

        contact = await self._recipient_contact(recipient_type, recipient_id)
        locale = contact.get("preferred_language") or "en"
        title, body = self._render(definition, key, recipient_type, locale, payload)

        for channel in definition.channels_for(recipient_type):
            if channel == "database":
                await self._write_inbox(
                    outbox_id, recipient_type, recipient_id, key, definition, title, body, payload
                )
            elif channel == "sms":
                await self._deliver_channel(
                    outbox_id,
                    "sms",
                    recipient_type,
                    recipient_id,
                    definition,
                    contact,
                    title,
                    body,
                )
            elif channel == "email":
                await self._deliver_channel(
                    outbox_id,
                    "email",
                    recipient_type,
                    recipient_id,
                    definition,
                    contact,
                    title,
                    body,
                )
            else:
                raise ValueError(f"Unsupported notification channel: {channel}")

    async def _deliver_channel(
        self,
        outbox_id: str,
        channel: str,
        recipient_type: str,
        recipient_id: str,
        definition: Any,
        contact: dict[str, Any],
        title: str,
        body: str,
    ) -> None:
        if not await self._preference_allows(recipient_type, recipient_id, definition.category, channel):
            return
        existing = await self._sql.execute(
            NotificationQueryIds.DELIVERY_FIND_BY_CHANNEL,
            {"outbox_id": outbox_id, "channel": channel},
            fetch="one",
        )
        if existing is not None:
            return
        attempt = await self._sql.execute(
            NotificationQueryIds.DELIVERY_CREATE,
            {
                "outbox_id": outbox_id,
                "channel": channel,
                "provider_reference": None,
                "status": "processing",
                "attempt_no": 1,
                "next_retry_at": None,
                "failure_reason": None,
            },
            fetch="one",
        )
        attempt_id = str(attempt["attempt_id"])
        await self._run_attempt(attempt_id, 1, channel, outbox_id, contact, title, body)

    async def _run_attempt(
        self,
        attempt_id: str,
        attempt_no: int,
        channel: str,
        outbox_id: str,
        contact: dict[str, Any],
        title: str,
        body: str,
    ) -> None:
        try:
            if channel == "sms":
                provider_reference = await self._send_sms(outbox_id, contact.get("phone"), title, body)
            elif channel == "email":
                provider_reference = await self._send_email(contact.get("email"), title, body)
            else:
                raise ValueError(f"Unsupported notification channel: {channel}")
            await self._sql.execute(
                NotificationQueryIds.DELIVERY_UPDATE_STATUS,
                {
                    "attempt_id": attempt_id,
                    "status": "submitted",
                    "failure_reason": None,
                    "next_retry_at": None,
                    "provider_reference": provider_reference,
                },
                fetch="one",
            )
        except Exception as exc:  # noqa: BLE001 — record the failure, never raise into the drain loop
            logger.warning("%s delivery failed for outbox %s: %s", channel, outbox_id, exc)
            await self._record_attempt_failure(attempt_id, attempt_no, exc)

    async def _record_attempt_failure(self, attempt_id: str, attempt_no: int, exc: Exception) -> None:
        retry = should_retry(attempt_no, self._retry_policy)
        next_retry_at = (
            datetime.now(UTC) + timedelta(seconds=compute_backoff(attempt_no, self._retry_policy))
            if retry
            else None
        )
        await self._sql.execute(
            NotificationQueryIds.DELIVERY_UPDATE_STATUS,
            {
                "attempt_id": attempt_id,
                "status": "pending" if retry else "failed",
                "failure_reason": str(exc)[:500],
                "next_retry_at": next_retry_at,
                "provider_reference": None,
            },
            fetch="one",
        )

    # -- channel senders ---------------------------------------------------------

    async def _send_sms(self, outbox_id: str, phone: str | None, title: str, body: str) -> str | None:
        if not phone or self._messaging is None:
            raise ValueError("SMS contact or gateway is unavailable")
        result = await self._messaging.send_sms(
            phone,
            f"{title}: {body}"[:480],
            notification_id=outbox_id,
        )
        if result.get("status") not in ("QUEUED", "SENT", "DELIVERED"):
            raise ValueError("SMS gateway did not accept the message")
        return str(result.get("provider_message_uid") or "") or None

    async def _send_email(self, email: str | None, title: str, body: str) -> str | None:
        if not email or self._messaging is None:
            raise ValueError("Email contact or gateway is unavailable")
        result = await self._messaging.send_email(email, title, body)
        if result.get("accepted") is not True:
            raise ValueError("Email gateway did not accept the message")
        return str(result.get("message_id") or "") or None

    # -- database channel ----------------------------------------------------------

    async def _write_inbox(
        self,
        outbox_id: str,
        recipient_type: str,
        recipient_id: str,
        key: str,
        definition: Any,
        title: str,
        body: str,
        payload: dict[str, Any],
    ) -> None:
        ref_type, ref_id = _derive_reference(payload)
        if recipient_type == "customer":
            await self._sql.execute(
                NotificationQueryIds.CREATE,
                {
                    "customer_id": recipient_id,
                    "type": key,
                    "title": title[:160],
                    "body": (body or "")[:500] or None,
                    "ref_type": ref_type,
                    "ref_id": ref_id,
                    "outbox_id": outbox_id,
                },
                fetch="one",
            )
        else:
            await self._sql.execute(
                NotificationQueryIds.PROVIDER_CREATE,
                {
                    "user_id": recipient_id,
                    "channel": "in_app",
                    "category": definition.category,
                    "title": title[:256],
                    "body": body,
                    "reference_type": ref_type,
                    "reference_id": ref_id,
                    "outbox_id": outbox_id,
                },
                fetch="one",
            )

    # -- locale + contact resolution -------------------------------------------------

    async def _recipient_contact(self, recipient_type: str, recipient_id: str) -> dict[str, Any]:
        query_id = (
            NotificationQueryIds.CUSTOMER_LANGUAGE_GET
            if recipient_type == "customer"
            else NotificationQueryIds.PROVIDER_LANGUAGE_GET
        )
        id_key = "customer_id" if recipient_type == "customer" else "provider_id"
        row = await self._sql.execute(query_id, {id_key: recipient_id}, fetch="one")
        return dict(row or {})

    def _render(
        self, definition: Any, key: str, recipient_type: str, locale: str, payload: dict[str, Any]
    ) -> tuple[str, str]:
        from app.platform.notifications.locales import render_locale_template

        rendered = render_locale_template(key, recipient_type, locale, payload)
        if rendered is not None:
            return rendered
        if definition.title_template and definition.body_template:
            try:
                return (
                    definition.title_template.format(**payload),
                    definition.body_template.format(**payload),
                )
            except (KeyError, IndexError):
                return definition.title_template, definition.body_template
        return "You have a new notification", ""

    # -- preferences -----------------------------------------------------------------

    async def _preference_allows(
        self, recipient_type: str, recipient_id: str, category: str, channel: str
    ) -> bool:
        if channel == "database":
            return True
        pref_key = f"NOTIFY_{category}_{channel.upper()}"
        query_id = (
            NotificationQueryIds.CUSTOMER_PREFERENCE_LIST
            if recipient_type == "customer"
            else NotificationQueryIds.PROVIDER_PREFERENCE_LIST
        )
        id_key = "customer_id" if recipient_type == "customer" else "user_id"
        try:
            rows = await self._sql.execute(query_id, {id_key: recipient_id}, fetch="all")
        except Exception:  # noqa: BLE001 — a preference lookup failure must not block delivery
            rows = []
        for row in rows or []:
            if row.get("key") == pref_key:
                return str(row.get("value")).lower() in ("true", "1")
        return _DEFAULT_CHANNEL_ENABLED.get((category, channel.upper()), False)

    # -- customer notification-center reads -------------------------------------

    async def list(
        self, customer_id: str, *, unread_only: bool = False, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            NotificationQueryIds.LIST,
            {"customer_id": customer_id, "unread_only": unread_only, "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])

    async def mark_read(self, customer_id: str, notification_id: str) -> bool:
        row = await self._sql.execute(
            NotificationQueryIds.MARK_READ,
            {"customer_id": customer_id, "notification_id": notification_id},
            fetch="one",
        )
        return bool(row)

    async def mark_all(self, customer_id: str) -> int:
        row = await self._sql.execute(
            NotificationQueryIds.MARK_ALL,
            {"customer_id": customer_id},
            fetch="one",
        )
        return int((row or {}).get("marked") or 0)

    async def unread_count(self, customer_id: str) -> int:
        row = await self._sql.execute(
            NotificationQueryIds.UNREAD,
            {"customer_id": customer_id},
            fetch="one",
        )
        return int((row or {}).get("unread_count") or 0)
