"""Kernel tests — verify the IMPLEMENTED plumbing (pure, zero IO)."""
from __future__ import annotations

import pytest

from app.security.ownership import assert_owner
from app.shared.exceptions.hierarchy import AuthorizationError
from app.shared.helpers.identifiers import new_correlation_id, new_request_id
from app.shared.pagination.paginator import Page, Paginator
from app.shared.responses.envelope import error_envelope, success_envelope


def test_success_envelope_shape():
    envelope = success_envelope(data={"a": 1}, request_id="req-x")
    assert envelope["success"] is True
    assert envelope["message"]["type"] == "success"
    assert envelope["data"] == {"a": 1}
    assert envelope["request_id"] == "req-x"


def test_error_envelope_has_error_block():
    envelope = error_envelope(code="TEST.CODE", title="T", body="b")
    assert envelope["success"] is False
    assert envelope["error"]["code"] == "TEST.CODE"


def test_paginator_normalizes_and_slices():
    page, size = Paginator.normalize(0, 999)
    assert (page, size) == (1, Paginator.MAX_SIZE)
    result = Paginator.from_sequence(list(range(25)), page=2, size=10)
    assert isinstance(result, Page)
    assert result.items == list(range(10, 20))
    assert result.total == 25 and result.pages == 3


def test_identifier_formats():
    assert new_request_id().startswith("req-")
    assert new_correlation_id().startswith("COR-")


def test_backoff_within_bounds():
    from app.jobs.retry import RetryPolicy, compute_backoff

    policy = RetryPolicy(base_delay_seconds=1.0, max_delay_seconds=8.0)
    for attempt in range(1, 6):
        delay = compute_backoff(attempt, policy)
        assert 0 <= delay <= 8.0 * 1.5


def test_ownership_assertion():
    assert_owner("u1", "u1")
    with pytest.raises(AuthorizationError):
        assert_owner("u1", "u2")


def test_money_value_object():
    from decimal import Decimal

    from app.domains.assets.value_objects.money import Money

    total = Money(Decimal("10.00"), "USD").add(Money(Decimal("5.50"), "USD"))
    assert total.amount == Decimal("15.50")
    with pytest.raises(ValueError):
        Money(Decimal("1"), "USD").add(Money(Decimal("1"), "EUR"))


def test_asset_code_validation():
    from app.domains.assets.value_objects.asset_code import AssetCode

    assert AssetCode("AST-ABC123").value == "AST-ABC123"
    with pytest.raises(ValueError):
        AssetCode("bad-code")


def test_query_validator_flags_missing_ownership():
    from app.registries.queries.query_definition import QueryDefinition, QuerySecurity
    from app.registries.queries.query_validator import QueryValidator

    validator = QueryValidator()
    definition = QueryDefinition(
        query_id="TEST.READ",
        sql_path="unused.sql",
        operation="read",
        security=QuerySecurity(ownership_filter_required=True),
    )
    issues = validator.validate_text("SELECT * FROM things WHERE id = :id", definition)
    assert any("ownership" in i for i in issues)


def test_screen_permissions_wildcard():
    from app.registries.screens.screen_definition import ScreenDefinition
    from app.registries.screens.screen_permissions import ScreenPermissions

    screen = ScreenDefinition(id="SCR-T-001", name="T", module="t", route="/t", permission="t.view")
    assert ScreenPermissions.satisfies(frozenset({"*"}), screen)
    assert ScreenPermissions.satisfies(frozenset({"t.view"}), screen)
    assert not ScreenPermissions.satisfies(frozenset({"other.view"}), screen)
