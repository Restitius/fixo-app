"""Fixtures for the security test suite — real JWTs, real HTTP client, real DB rows.

No RBAC/IDOR test infrastructure existed before this suite (no as_role
fixture, no JWT-minting helper, no factories) — this file builds it,
reusing the same session-scoped composition-bootstrap pattern already
established in tests/api/test_provider_job_review.py, and the shared
httpx AsyncClient fixture from tests/conftest.py.

Deliberately real, not mocked: tokens are minted with the actual
JwtService (composition.jwt), against actual customer/provider rows
that already exist in the database this test run points at — the same
CUSTOMERS/PROVIDERS audience shapes issued by the real login flows in
app/domains/customers/services/auth_service.py and
app/domains/providers/services/provider_auth_service.py.
"""
from __future__ import annotations

from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.startup.composition import get_composition

_engine: Any = None
_comp: Any = None


@pytest.fixture(scope="session", autouse=True)
async def _ensure_composition():
    """Bootstrap the composition root once for the whole security suite."""
    global _engine, _comp
    if _comp is None:
        boot = Bootstrap()
        await boot.run_startup()
        _comp = get_composition()
        _engine = _comp.sql_query_manager._databases.engine_for("PRIMARY_DB")
    yield
    if _engine is not None:
        await _engine.dispose()


@pytest.fixture(scope="session")
async def real_customer_id() -> str:
    """An existing customer id, real audience for a real customer token."""
    async with _engine.begin() as conn:
        row = (await conn.execute(text('SELECT customer_id FROM "CUSTOMERS" LIMIT 1'))).first()
    if not row:
        pytest.skip("No customer rows available in the database")
    return str(row[0])


@pytest.fixture(scope="session")
async def second_customer_id(real_customer_id: str) -> str:
    """A second, distinct customer id — for cross-owner IDOR assertions."""
    async with _engine.begin() as conn:
        row = (await conn.execute(
            text('SELECT customer_id FROM "CUSTOMERS" WHERE customer_id != :cid LIMIT 1'),
            {"cid": real_customer_id},
        )).first()
    if not row:
        pytest.skip("Need at least 2 distinct customers for an IDOR test")
    return str(row[0])


@pytest.fixture(scope="session")
async def real_provider_id() -> str:
    """An existing provider id, real audience for a real provider token."""
    async with _engine.begin() as conn:
        row = (await conn.execute(text('SELECT provider_id FROM "PROVIDERS" LIMIT 1'))).first()
    if not row:
        pytest.skip("No provider rows available in the database")
    return str(row[0])


@pytest.fixture(scope="session")
async def second_provider_id(real_provider_id: str) -> str:
    """A second, distinct provider id — for cross-owner IDOR assertions."""
    async with _engine.begin() as conn:
        row = (await conn.execute(
            text('SELECT provider_id FROM "PROVIDERS" WHERE provider_id != :pid LIMIT 1'),
            {"pid": real_provider_id},
        )).first()
    if not row:
        pytest.skip("Need at least 2 distinct providers for an IDOR test")
    return str(row[0])


def _customer_token(customer_id: str) -> str:
    """Mint a real access token exactly as auth_service.py's login() does."""
    return _comp.jwt.encode_access({"sub": customer_id, "role": "customer"})


def _provider_token(provider_id: str) -> str:
    """Mint a real access token exactly as provider_auth_service.py's _issue_tokens() does."""
    return _comp.jwt.encode_access({"sub": provider_id, "principal": "PROVIDER"})


@pytest.fixture()
def as_customer(real_customer_id: str):
    """Bearer-auth header for the real_customer_id fixture's identity."""
    def _make(customer_id: str | None = None) -> dict[str, str]:
        return {"Authorization": f"Bearer {_customer_token(customer_id or real_customer_id)}"}
    return _make


@pytest.fixture()
def as_provider(real_provider_id: str):
    """Bearer-auth header for the real_provider_id fixture's identity."""
    def _make(provider_id: str | None = None) -> dict[str, str]:
        return {"Authorization": f"Bearer {_provider_token(provider_id or real_provider_id)}"}
    return _make


@pytest.fixture(scope="session")
async def owned_booking(real_customer_id: str) -> dict[str, str] | None:
    """A booking owned by real_customer_id, if one exists — None otherwise."""
    async with _engine.begin() as conn:
        row = (await conn.execute(
            text('SELECT booking_id FROM "BOOKINGS" WHERE customer_id = :cid LIMIT 1'),
            {"cid": real_customer_id},
        )).first()
    return {"booking_id": str(row[0])} if row else None


@pytest.fixture(scope="session")
async def owned_invoice(real_customer_id: str) -> dict[str, str] | None:
    """An invoice owned by real_customer_id, if one exists — None otherwise."""
    async with _engine.begin() as conn:
        row = (await conn.execute(
            text('SELECT invoice_id FROM "INVOICES" WHERE customer_id = :cid LIMIT 1'),
            {"cid": real_customer_id},
        )).first()
    return {"invoice_id": str(row[0])} if row else None


@pytest.fixture(scope="session")
async def owned_provider_booking(real_provider_id: str) -> dict[str, str] | None:
    """A booking assigned to real_provider_id, if one exists — None otherwise."""
    async with _engine.begin() as conn:
        row = (await conn.execute(
            text('SELECT booking_id FROM "BOOKINGS" WHERE provider_id = :pid LIMIT 1'),
            {"pid": real_provider_id},
        )).first()
    return {"booking_id": str(row[0])} if row else None
