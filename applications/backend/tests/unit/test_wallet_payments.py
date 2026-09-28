"""Wallet-funded booking payments: hold, adjust at capture, refund once, routing."""
from __future__ import annotations

import pytest

from app.domains.payments.services.settlement_service import PaymentSettlementService
from app.integrations.external.payments.mock_gateway import MockPaymentGateway
from app.integrations.external.payments.routing_gateway import RoutingPaymentGateway
from app.integrations.external.payments.wallet_gateway import WalletPaymentGateway


class FakeWallet:
    def __init__(self, balance: float) -> None:
        self.balance = balance
        self.entries: list[tuple] = []
        self.refunded: set[str] = set()

    async def debit(self, customer_id, amount, *, reference_type=None, reference_id=None, description=None):
        if amount > self.balance:
            raise ValueError("Insufficient wallet balance")
        self.balance -= amount
        self.entries.append(("DEBIT", amount, reference_type))
        return {"amount": amount}

    async def credit(self, customer_id, amount, *, reference_type=None, reference_id=None, description=None):
        self.balance += amount
        self.entries.append(("CREDIT", amount, reference_type))
        return {"amount": amount}

    async def refund_booking(self, customer_id, amount, booking_id, description=None):
        if booking_id in self.refunded or amount <= 0:
            return None
        self.refunded.add(booking_id)
        self.balance += amount
        self.entries.append(("CREDIT", amount, "BOOKING_REFUND"))
        return {"amount": amount}


def _gateways(wallet):
    wallet_gw = WalletPaymentGateway(lambda: wallet)
    return wallet_gw, RoutingPaymentGateway(default=MockPaymentGateway(), wallet=wallet_gw)


CTX = {"customer_id": "c1", "booking_id": "b1"}


async def test_wallet_authorize_holds_funds_and_fails_when_short():
    wallet = FakeWallet(100_000)
    _, gateway = _gateways(wallet)
    ok = await gateway.authorize("pay-1", 2_800_000, "TZS", method="WALLET", **CTX)
    assert ok["authorized"] and ok["gateway_ref"].startswith("WALLET-AUTH-")
    assert wallet.balance == 72_000

    short = await gateway.authorize("pay-2", 9_000_000, "TZS", method="WALLET", **CTX)
    assert short["authorized"] is False and "Insufficient" in short["failure_reason"]
    assert wallet.balance == 72_000


async def test_default_method_uses_the_mock_gateway_and_never_touches_the_wallet():
    wallet = FakeWallet(100_000)
    _, gateway = _gateways(wallet)
    result = await gateway.authorize("pay-1", 2_800_000, "TZS", method="EXTERNAL", **CTX)
    assert result["gateway_ref"].startswith("MOCK-AUTH-") and wallet.balance == 100_000
    assert (await gateway.capture(result["gateway_ref"], 2_800_000, **CTX, held_cents=2_800_000))["captured"]
    assert wallet.entries == []


@pytest.mark.parametrize(
    "final_cents,expected_balance",
    [(3_400_000, 66_000 - 0), (2_800_000, 72_000), (2_000_000, 80_000)],
)
async def test_capture_settles_the_difference_between_held_and_final_amount(final_cents, expected_balance):
    wallet = FakeWallet(100_000)
    _, gateway = _gateways(wallet)
    auth = await gateway.authorize("pay-1", 2_800_000, "TZS", method="WALLET", **CTX)
    captured = await gateway.capture(auth["gateway_ref"], final_cents, **CTX, held_cents=2_800_000)
    assert captured["captured"] is True
    assert wallet.balance == pytest.approx(expected_balance)


async def test_capture_fails_when_the_price_rose_beyond_the_balance():
    wallet = FakeWallet(28_000)
    _, gateway = _gateways(wallet)
    auth = await gateway.authorize("pay-1", 2_800_000, "TZS", method="WALLET", **CTX)
    captured = await gateway.capture(auth["gateway_ref"], 3_400_000, **CTX, held_cents=2_800_000)
    assert captured["captured"] is False and "Insufficient" in captured["failure_reason"]


async def test_refund_is_paid_once_per_booking():
    wallet = FakeWallet(100_000)
    _, gateway = _gateways(wallet)
    auth = await gateway.authorize("pay-1", 2_800_000, "TZS", method="WALLET", **CTX)
    first = await gateway.refund(auth["gateway_ref"], 2_240_000, "cancel", **CTX)
    again = await gateway.refund(auth["gateway_ref"], 2_240_000, "cancel", **CTX)
    assert first["refunded"] is True and again["refunded"] is False
    assert wallet.balance == pytest.approx(72_000 + 22_400)


class FakePayments:
    def __init__(self, gateway_ref):
        self._ref = gateway_ref

    async def get_authorization(self, customer_id, booking_id):
        return {"payment_id": "p1", "gateway_ref": self._ref, "amount": 28000} if self._ref else None


async def test_settlement_releases_wallet_holds_and_ignores_missing_authorizations():
    wallet = FakeWallet(100_000)
    _, gateway = _gateways(wallet)
    auth = await gateway.authorize("pay-1", 2_800_000, "TZS", method="WALLET", **CTX)
    service = PaymentSettlementService(FakePayments(auth["gateway_ref"]), gateway)
    result = await service.release("c1", "b1", 28_000, "cancelled")
    assert result["refunded"] is True and wallet.balance == 100_000

    assert await PaymentSettlementService(FakePayments(None), gateway).release("c1", "b1", 1) is None


async def test_settlement_never_raises_when_the_gateway_fails():
    class Boom:
        async def refund(self, *a, **k):
            raise RuntimeError("gateway down")

    service = PaymentSettlementService(FakePayments("WALLET-AUTH-X"), Boom())
    assert await service.release("c1", "b1", 10) is None
