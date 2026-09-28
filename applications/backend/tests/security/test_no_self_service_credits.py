"""Customers must never be able to mint wallet money or loyalty points themselves.

Wallet credit and loyalty points are granted by server-side flows only (booking
completion, refunds, promotions). A customer-callable credit/earn route would let
any signed-in user print unlimited balance with one request.
"""
from __future__ import annotations

from app.main import app

_FORBIDDEN_SUFFIXES = (
    "/wallet/credit",
    "/wallet/debit",
    "/loyalty/earn",
    "/loyalty/spend",
)


def _served_paths() -> dict[str, dict]:
    app.openapi_schema = None
    return app.openapi()["paths"]


def test_no_customer_route_mutates_wallet_or_loyalty_balance():
    offenders = [p for p in _served_paths() if p.endswith(_FORBIDDEN_SUFFIXES)]
    assert not offenders, f"self-service balance mutation routes exist: {offenders}"


def test_wallet_and_loyalty_read_routes_still_exist():
    paths = _served_paths()
    assert "get" in paths["/api/v1/wallet/balance"]
    assert "get" in paths["/api/v1/wallet/transactions"]
    assert "get" in paths["/api/v1/loyalty/account"]
