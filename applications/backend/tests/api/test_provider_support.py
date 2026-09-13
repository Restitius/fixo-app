"""Integration tests for Phase 40 - provider support tickets.

Exercises the full registry-driven SQL adapter path through the real
composition root: create ticket -> list -> get -> add message -> list
messages, plus ownership isolation (a different provider must not see
or be able to touch the ticket) and the closed-ticket message block.

Self-cleaning: the fixture teardown deletes any rows written to
PROVIDER_SUPPORT_TICKETS / PROVIDER_TICKET_MESSAGES.
"""
from __future__ import annotations

from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError
from app.startup.composition import get_composition

_engine: Any = None
_comp: Any = None


@pytest.fixture(scope="session", autouse=True)
async def _ensure_composition():
    global _engine, _comp
    if _comp is None:
        boot = Bootstrap()
        await boot.run_startup()
        _comp = get_composition()
        _engine = _comp.sql_query_manager._databases.engine_for("PRIMARY_DB")
    yield
    if _engine is not None:
        await _engine.dispose()


@pytest.fixture()
async def _providers():
    if _comp is None:
        pytest.skip("Composition not bootstrapped")
    async with _engine.begin() as conn:
        rows = (await conn.execute(
            text('SELECT provider_id FROM "PROVIDERS" ORDER BY created_at LIMIT 2')
        )).fetchall()
    if len(rows) < 2:
        pytest.skip("Need at least two providers in the database")
    yield {"provider_id": str(rows[0][0]), "other_provider_id": str(rows[1][0])}


@pytest.fixture()
async def _cleanup_tickets():
    created: list[str] = []
    yield created
    if created:
        async with _engine.begin() as conn:
            for tid in created:
                await conn.execute(
                    text('DELETE FROM "PROVIDER_SUPPORT_TICKETS" WHERE ticket_id = :tid'),
                    {"tid": tid},
                )


@pytest.mark.asyncio
async def test_full_ticket_flow(_providers, _cleanup_tickets):
    pid = _providers["provider_id"]
    other_pid = _providers["other_provider_id"]
    svc = _comp.provider_support_service()

    ticket = await svc.create_ticket(pid, "Payout delayed", "PAYOUT", "HIGH")
    _cleanup_tickets.append(ticket["ticket_id"])
    assert ticket["status"] == "OPEN"
    assert ticket["category"] == "PAYOUT"

    tickets = await svc.list_tickets(pid)
    assert any(t["ticket_id"] == ticket["ticket_id"] for t in tickets)

    got = await svc.get_ticket(str(ticket["ticket_id"]), pid)
    assert got["subject"] == "Payout delayed"

    message = await svc.add_message(
        str(ticket["ticket_id"]), pid, sender="PROVIDER", body="Any update?"
    )
    assert message["sender"] == "PROVIDER"
    assert message["body"] == "Any update?"

    messages = await svc.list_messages(str(ticket["ticket_id"]), pid)
    assert len(messages) == 1
    assert messages[0]["body"] == "Any update?"

    # Ownership isolation: a different provider cannot read or reply.
    with pytest.raises(NotFoundError):
        await svc.get_ticket(str(ticket["ticket_id"]), other_pid)
    with pytest.raises(NotFoundError):
        await svc.add_message(str(ticket["ticket_id"]), other_pid, sender="PROVIDER", body="nope")

    # Closed tickets reject further messages.
    async with _engine.begin() as conn:
        await conn.execute(
            text('UPDATE "PROVIDER_SUPPORT_TICKETS" SET status = \'CLOSED\' WHERE ticket_id = :tid'),
            {"tid": str(ticket["ticket_id"])},
        )
    with pytest.raises(ConflictError):
        await svc.add_message(str(ticket["ticket_id"]), pid, sender="PROVIDER", body="too late")
