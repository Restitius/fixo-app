"""IDOR / ownership tests — the single highest-risk defect class for FIXO.

Role is not ownership: a customer is allowed to read bookings, and must
not be allowed to read another customer's booking by guessing its id.

FIXO-APP enforces ownership two different, real ways (confirmed this
session by reading the actual query/service code, not assumed from the
handbook's generic example):

  - The load-bearing majority of domains (bookings, provider bookings,
    invoices) enforce ownership purely via the SQL WHERE clause getting
    the caller's id as a bind param (WHERE customer_id = :customer_id /
    WHERE provider_id = :user_id). A cross-owner request finds no row —
    the service raises NotFoundError, which the API layer maps to 404.
  - A handful of domains (assets, users, authentication, transactions,
    liabilities, notifications) use an explicit app/security/ownership.py
    -> AuthorizationError -> 403 path instead (and, per that codebase's
    own comments, are also the least-finished/scaffold-heaviest domains).

These tests assert the status each domain's actual mechanism produces —
not one universal "pick 404 or 403" answer imposed from outside, since
that isn't what the code does today.
"""
from __future__ import annotations

import pytest


async def test_customer_cannot_read_another_customers_booking(client, as_customer, owned_booking, second_customer_id):
    if owned_booking is None:
        pytest.skip("No booking available in the database to test ownership against")
    response = await client.get(
        f"/api/v1/bookings/{owned_booking['booking_id']}",
        headers=as_customer(second_customer_id),
    )
    # SQL-ownership domain: WHERE customer_id = :customer_id finds no row.
    assert response.status_code == 404


async def test_customer_can_read_their_own_booking(client, as_customer, owned_booking, real_customer_id):
    if owned_booking is None:
        pytest.skip("No booking available in the database to test ownership against")
    response = await client.get(
        f"/api/v1/bookings/{owned_booking['booking_id']}",
        headers=as_customer(real_customer_id),
    )
    assert response.status_code == 200


async def test_customer_cannot_read_another_customers_invoice(client, as_customer, owned_invoice, second_customer_id):
    if owned_invoice is None:
        pytest.skip("No invoice available in the database to test ownership against")
    response = await client.get(
        f"/api/v1/invoices/{owned_invoice['invoice_id']}",
        headers=as_customer(second_customer_id),
    )
    assert response.status_code == 404


async def test_provider_cannot_read_another_providers_booking(
    client, as_provider, owned_provider_booking, second_provider_id
):
    if owned_provider_booking is None:
        pytest.skip("No provider-assigned booking available to test ownership against")
    response = await client.get(
        f"/api/v1/providers/me/bookings/{owned_provider_booking['booking_id']}",
        headers=as_provider(second_provider_id),
    )
    assert response.status_code == 404


async def test_provider_can_read_their_own_booking(client, as_provider, owned_provider_booking, real_provider_id):
    if owned_provider_booking is None:
        pytest.skip("No provider-assigned booking available to test ownership against")
    response = await client.get(
        f"/api/v1/providers/me/bookings/{owned_provider_booking['booking_id']}",
        headers=as_provider(real_provider_id),
    )
    assert response.status_code == 200


async def test_missing_and_forbidden_bookings_are_indistinguishable(client, as_customer, owned_booking, second_customer_id):
    """A missing id and another owner's id must return the same shape —
    returning 404 for one and 403 for the other tells an attacker which
    booking ids are real. FIXO-APP's SQL-ownership domains naturally
    satisfy this since both cases are the same "no row matched" path."""
    if owned_booking is None:
        pytest.skip("No booking available in the database to test ownership against")
    forbidden = await client.get(
        f"/api/v1/bookings/{owned_booking['booking_id']}",
        headers=as_customer(second_customer_id),
    )
    missing = await client.get(
        "/api/v1/bookings/00000000-0000-0000-0000-000000000000",
        headers=as_customer(second_customer_id),
    )
    assert forbidden.status_code == missing.status_code == 404


async def test_missing_and_forbidden_provider_bookings_are_indistinguishable(
    client, as_provider, owned_provider_booking, second_provider_id
):
    if owned_provider_booking is None:
        pytest.skip("No provider-assigned booking available to test ownership against")
    forbidden = await client.get(
        f"/api/v1/providers/me/bookings/{owned_provider_booking['booking_id']}",
        headers=as_provider(second_provider_id),
    )
    missing = await client.get(
        "/api/v1/providers/me/bookings/00000000-0000-0000-0000-000000000000",
        headers=as_provider(second_provider_id),
    )
    assert forbidden.status_code == missing.status_code == 404
