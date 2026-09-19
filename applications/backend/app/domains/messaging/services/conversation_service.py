"""ConversationService — Module 19: customer↔provider messaging.

Thread opens lazily on first use. The provider side posts through the
internal provider-events channel; customers post here.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import ValidationError


class ConversationService:
    MAX_BODY = 2000

    def __init__(self, messaging: Any, bookings: Any) -> None:
        self._messaging = messaging   # MessagingRepository port
        self._bookings = bookings     # BookingRepository port (ownership)

    async def thread(
        self, customer_id: str, booking_id: str,
        *, limit: int = 50, offset: int = 0
    ) -> dict[str, Any]:
        await self._bookings.get(customer_id, booking_id)  # ownership
        convo = await self._messaging.open_conversation(customer_id, booking_id)
        if not convo:
            raise ValidationError("Could not open the conversation")

        messages = await self._messaging.list_thread(
            customer_id, str(convo["conversation_id"]), limit=limit, offset=offset
        )
        unread = await self._messaging.unread_count(
            customer_id, str(convo["conversation_id"])
        )
        return {
            "conversation_id": str(convo["conversation_id"]),
            "unread_count": unread,
            "messages": [
                {
                    "message_id": str(m["message_id"]),
                    "from_provider": m["sender_role"] == "PROVIDER",
                    "body": m["body"],
                    "read_at": m.get("read_at"),
                    "created_at": m["created_at"],
                }
                for m in messages
            ],
        }

    async def send(
        self, customer_id: str, booking_id: str, body: str
    ) -> dict[str, Any]:
        clean = str(body or "").strip()
        if not clean:
            raise ValidationError("Message body is required")
        if len(clean) > self.MAX_BODY:
            raise ValidationError(f"Message must be at most {self.MAX_BODY} characters")

        await self._bookings.get(customer_id, booking_id)  # ownership
        convo = await self._messaging.open_conversation(customer_id, booking_id)
        row = await self._messaging.send_as_customer(
            customer_id, str(convo["conversation_id"]), clean
        )
        if not row:
            raise ValidationError("Could not send the message")
        return {
            "message_id": str(row["message_id"]),
            "body": row["body"],
            "created_at": row["created_at"],
        }