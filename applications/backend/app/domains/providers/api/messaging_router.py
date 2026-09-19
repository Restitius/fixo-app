"""Provider Messaging Router (Requirement Phase 17).

Provider-scoped messaging endpoints linked to bookings.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import CurrentProvider
from app.domains.providers.services.provider_messaging_service import ProviderMessagingService
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/bookings/{booking_id}/messages", tags=["provider-messaging"])


def _service() -> ProviderMessagingService:
    return get_composition().provider_messaging_service()


@router.get("/conversation")
async def get_conversation(
    booking_id: str,
    provider: CurrentProvider,
    svc: ProviderMessagingService = Depends(_service),
) -> dict:
    """Get-or-create the booking's conversation."""
    return await svc.conversation(str(provider["provider_id"]), booking_id)


@router.get("")
async def list_messages(
    booking_id: str,
    provider: CurrentProvider,
    conversation_id: str = Query(...),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    svc: ProviderMessagingService = Depends(_service),
) -> list[dict]:
    """List conversation messages (marks customer messages read)."""
    return await svc.messages(str(provider["provider_id"]), conversation_id, limit, offset)


@router.post("")
async def send_message(
    booking_id: str,
    provider: CurrentProvider,
    payload: dict,
    svc: ProviderMessagingService = Depends(_service),
) -> dict:
    """Send a message from the provider."""
    return await svc.send(
        str(provider["provider_id"]),
        payload.get("conversation_id", ""),
        payload.get("body", ""),
    )


@router.get("/unread")
async def unread_count(
    booking_id: str,
    provider: CurrentProvider,
    conversation_id: str = Query(...),
    svc: ProviderMessagingService = Depends(_service),
) -> dict:
    """Count unread customer messages."""
    count = await svc.unread(str(provider["provider_id"]), conversation_id)
    return {"unread_count": count}
