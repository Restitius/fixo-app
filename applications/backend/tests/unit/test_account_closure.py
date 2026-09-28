"""Account closure: consequences preview, identity check and blocking conditions."""
from __future__ import annotations

import pytest

from app.domains.accounts.services.account_service import AccountClosureService
from app.security.password import PasswordHasher
from app.shared.exceptions.hierarchy import ConflictError, ValidationError


class FakeClosureRepo:
    def __init__(self, preview=None, closed=True):
        self._preview = preview or {
            "active_bookings": 0,
            "pending_payments": 0,
            "open_disputes": 0,
            "active_warranties": 0,
            "wallet_balance": 0.0,
        }
        self._closed = closed
        self.scheduled = 0

    async def closure_preview(self, customer_id):
        return dict(self._preview)

    async def schedule_closure(self, customer_id):
        self.scheduled += 1
        return {"closed": self._closed, "reversible": self._closed}


class FakeCustomers:
    def __init__(self, hasher):
        self._hash = hasher.hash("Test@12345")

    async def get_by_id_with_hash(self, customer_id):
        return {"customer_id": customer_id, "password_hash": self._hash}


def _service(repo):
    hasher = PasswordHasher()
    return AccountClosureService(repo, customers=FakeCustomers(hasher), hasher=hasher)


async def test_preview_lists_blockers_for_active_bookings_and_disputes():
    repo = FakeClosureRepo({"active_bookings": 2, "open_disputes": 1, "pending_payments": 1,
                            "active_warranties": 0, "wallet_balance": 500.0})
    preview = await _service(repo).preview("c1")
    assert preview["can_close"] is False
    assert len(preview["blockers"]) == 2
    assert preview["wallet_balance"] == 500.0


async def test_closure_requires_the_current_password():
    repo = FakeClosureRepo()
    svc = _service(repo)
    with pytest.raises(ValidationError):
        await svc.schedule_closure("c1")
    with pytest.raises(ValidationError):
        await svc.schedule_closure("c1", "wrong-password")
    assert repo.scheduled == 0


async def test_closure_is_refused_while_bookings_are_active():
    repo = FakeClosureRepo({"active_bookings": 1, "open_disputes": 0, "pending_payments": 0,
                            "active_warranties": 0, "wallet_balance": 0.0})
    with pytest.raises(ConflictError):
        await _service(repo).schedule_closure("c1", "Test@12345")
    assert repo.scheduled == 0


async def test_closure_succeeds_with_password_and_no_blockers():
    repo = FakeClosureRepo()
    result = await _service(repo).schedule_closure("c1", "Test@12345")
    assert result["closed"] is True and repo.scheduled == 1
    assert "kept for legal and financial reasons" in result["retained_data"]


async def test_closure_reports_when_the_account_cannot_be_closed():
    with pytest.raises(ConflictError):
        await _service(FakeClosureRepo(closed=False)).schedule_closure("c1", "Test@12345")
