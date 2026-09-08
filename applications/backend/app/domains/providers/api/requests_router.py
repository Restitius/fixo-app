"""Provider incoming-request routes — feed + accept/decline/quote/ask (Provider Req Phase 11).

The provider job lifecycle's entry point. Static paths (/responses, /quotes)
are declared before /{request_id} so FastAPI does not shadow them.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/requests", tags=["provider-requests"])


class RespondRequest(BaseModel):
    """ACCEPTED / DECLINED (with optional message) or QUESTION (with text)."""

    response_type: str = Field(max_length=12)
    question_text: str | None = Field(default=None, max_length=1000)
    response_message: str | None = Field(default=None, max_length=500)


class SubmitQuoteRequest(BaseModel):
    """A quote for a matched request."""

    amount: float = Field(gt=0)
    currency: str = Field(default="TZS", max_length=3)
    lead_time_days: int = Field(default=1, ge=0)
    message: str | None = Field(default=None, max_length=500)


def _service() -> Any:
    return get_composition().provider_request_service()


@router.get("/responses")
async def responses_list(provider: CurrentProvider) -> Any:
    """This provider's response ledger (accept/decline/question history)."""
    return ok(await _service().responses_list(str(provider["provider_id"])))


@router.get("/quotes")
async def quotes_list(provider: CurrentProvider) -> Any:
    """This provider's submitted quotes."""
    return ok(await _service().quotes_list(str(provider["provider_id"])))


@router.get("")
async def feed(provider: CurrentProvider) -> Any:
    """Incoming job requests awaiting a response, with countdowns."""
    return ok(await _service().feed(str(provider["provider_id"])))


@router.get("/{request_id}")
async def get_request(request_id: str, provider: CurrentProvider) -> Any:
    """One incoming request's full detail."""
    return ok(await _service().get(str(provider["provider_id"]), request_id))


@router.post("/{request_id}/respond")
async def respond(
    request_id: str, payload: RespondRequest, provider: CurrentProvider
) -> Any:
    """Accept, decline or ask a question about the request."""
    return ok(
        await _service().respond(
            str(provider["provider_id"]),
            request_id,
            payload.model_dump(exclude_unset=True),
        )
    )


@router.post("/{request_id}/quote")
async def submit_quote(
    request_id: str, payload: SubmitQuoteRequest, provider: CurrentProvider
) -> Any:
    """Submit a quote for the request."""
    return ok(
        await _service().submit_quote(
            str(provider["provider_id"]),
            request_id,
            payload.model_dump(exclude_unset=True),
        )
    )