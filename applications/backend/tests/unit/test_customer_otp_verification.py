"""Customer registration + email/phone OTP verification (AuthService, in-memory fakes)."""
from __future__ import annotations

import pytest

from app.domains.customers.services.auth_service import AuthService, normalize_phone
from app.domains.customers.services.otp_delivery import OtpDelivery, mask_destination
from app.security.jwt import JwtService
from app.security.password import PasswordHasher
from app.shared.exceptions.hierarchy import (
    AuthenticationError,
    ConflictError,
    RateLimitError,
    ValidationError,
)


class FakeCustomers:
    def __init__(self) -> None:
        self.rows: dict[str, dict] = {}

    async def get_by_email(self, email):
        return next((r for r in self.rows.values() if r["email"] == email), None)

    async def get_by_id(self, user_id):
        row = self.rows.get(user_id)
        return dict(row) if row else None

    async def create(self, params):
        row = {
            "customer_id": f"c{len(self.rows) + 1}",
            "full_name": params["full_name"],
            "email": params["email"],
            "phone": params["phone"],
            "status": "ACTIVE",
            "email_verified": False,
            "phone_verified": False,
            "password_hash": params["password_hash"],
        }
        self.rows[row["customer_id"]] = row
        return {k: row[k] for k in ("customer_id", "full_name", "email", "phone", "status")}

    async def mark_verified(self, user_id, *, email, phone):
        row = self.rows[user_id]
        row["email_verified"] = row["email_verified"] or email
        row["phone_verified"] = row["phone_verified"] or phone
        return {
            "customer_id": user_id,
            "email_verified": row["email_verified"],
            "phone_verified": row["phone_verified"],
        }

    async def update_profile(self, user_id, params):
        row = self.rows[user_id]
        if params.get("phone") and params["phone"] != row["phone"]:
            row["phone_verified"] = False
        for key in ("full_name", "phone", "preferred_language"):
            if params.get(key):
                row[key] = params[key]
        return row


class FakeOtps:
    def __init__(self) -> None:
        self.issued: list[dict] = []
        self.activity = {"issued": 0, "seconds_since_last": 1e9}

    async def issue(self, user_id, params):
        self.issued.append({"user_id": user_id, **params})

    async def verify(self, user_id, params):
        for otp in reversed(self.issued):
            if otp["user_id"] == user_id and otp["purpose"] == params["purpose"]:
                return otp["code_hash"] == params["code_hash"]
        return False

    async def recent_activity(self, user_id, purpose, window_seconds):
        return self.activity


class FakeMessaging:
    def __init__(self, fail: bool = False) -> None:
        self.sms: list[tuple] = []
        self.emails: list[tuple] = []
        self.fail = fail

    async def send_sms(self, to, text, **kw):
        if self.fail:
            raise RuntimeError("provider down")
        self.sms.append((to, text))
        return {"status": "QUEUED"}

    async def send_email(self, to, subject, body, **kw):
        if self.fail:
            raise RuntimeError("smtp down")
        self.emails.append((to, subject, body))
        return {"accepted": True}


def _service(messaging=None):
    otps, customers = FakeOtps(), FakeCustomers()
    svc = AuthService(
        customers=customers,
        otps=otps,
        sessions=None,
        hasher=PasswordHasher(),
        jwt_service=JwtService(secret="x" * 32),
        events=None,
        otp_delivery=OtpDelivery(messaging) if messaging is not None else None,
    )
    return svc, customers, otps


def _payload(**over):
    base = {
        "full_name": "Amina Juma",
        "phone": "+255 754 321 987",
        "email": "Amina@Example.com",
        "password": "Test@12345",
        "terms_accepted": True,
        "privacy_accepted": True,
    }
    return {**base, **over}


@pytest.mark.parametrize(
    "raw,expected",
    [("+255 754-321-987", "+255754321987"), ("00255754321987", "+255754321987"), ("(+255)754.321.987", "+255754321987")],
)
def test_normalize_phone_accepts_formatting(raw, expected):
    assert normalize_phone(raw) == expected


@pytest.mark.parametrize("raw", ["0754321987", "abc", "+0123456789", "+12", "255754321987"])
def test_normalize_phone_rejects_non_international(raw):
    with pytest.raises(ValidationError):
        normalize_phone(raw)


@pytest.mark.parametrize("terms,privacy", [(False, True), (True, False), (False, False)])
async def test_register_requires_terms_and_privacy(terms, privacy):
    svc, customers, _ = _service()
    with pytest.raises(ValidationError):
        await svc.register(_payload(terms_accepted=terms, privacy_accepted=privacy))
    assert customers.rows == {}


async def test_register_issues_and_delivers_both_codes():
    messaging = FakeMessaging()
    svc, customers, otps = _service(messaging)
    result = await svc.register(_payload())
    assert customers.rows["c1"]["phone"] == "+255754321987"
    assert [o["channel"] for o in otps.issued] == ["EMAIL", "SMS"]
    assert [o["purpose"] for o in otps.issued] == ["VERIFY_EMAIL", "VERIFY_PHONE"]
    assert messaging.emails[0][0] == "amina@example.com"
    assert messaging.sms[0][0] == "+255754321987"
    assert result["otp_code"] in messaging.emails[0][2]
    assert result["phone_otp_code"] in messaging.sms[0][1]


async def test_delivery_failure_does_not_break_registration():
    svc, customers, _ = _service(FakeMessaging(fail=True))
    result = await svc.register(_payload())
    assert result["customer_id"] == "c1"
    assert "c1" in customers.rows


async def test_each_channel_verifies_only_its_own_contact():
    svc, customers, _ = _service()
    result = await svc.register(_payload())
    email = "amina@example.com"

    with pytest.raises(AuthenticationError):
        await svc.verify_otp(email, result["otp_code"], "SMS")

    out = await svc.verify_otp(email, result["otp_code"], "EMAIL")
    assert out["email_verified"] is True and out["phone_verified"] is False

    out = await svc.verify_otp(email, result["phone_otp_code"], "SMS")
    assert out["email_verified"] is True and out["phone_verified"] is True
    assert customers.rows["c1"]["phone_verified"] is True


async def test_request_otp_rejects_already_verified_channel():
    svc, _, _ = _service()
    result = await svc.register(_payload())
    await svc.verify_otp("amina@example.com", result["otp_code"], "EMAIL")
    with pytest.raises(ConflictError):
        await svc.request_otp("amina@example.com", "EMAIL")


async def test_request_otp_unknown_account_does_not_leak():
    svc, _, otps = _service()
    assert (await svc.request_otp("nobody@example.com", "SMS"))["sent"] is True
    assert otps.issued == []


async def test_resend_cooldown_and_hourly_cap():
    svc, _, otps = _service()
    await svc.register(_payload())
    otps.activity = {"issued": 1, "seconds_since_last": 5.0}
    with pytest.raises(RateLimitError):
        await svc.request_otp("amina@example.com", "SMS")
    otps.activity = {"issued": 5, "seconds_since_last": 600.0}
    with pytest.raises(RateLimitError):
        await svc.request_otp("amina@example.com", "SMS")
    otps.activity = {"issued": 2, "seconds_since_last": 60.0}
    out = await svc.request_otp("amina@example.com", "SMS")
    assert out["channel"] == "SMS" and out["destination"].startswith("+255")
    assert "754321987" not in out["destination"]


async def test_changing_phone_resets_verification_and_issues_new_code():
    messaging = FakeMessaging()
    svc, customers, _ = _service(messaging)
    result = await svc.register(_payload())
    await svc.verify_otp("amina@example.com", result["phone_otp_code"], "SMS")
    assert customers.rows["c1"]["phone_verified"] is True

    updated = await svc.update_profile("c1", {"phone": "+255 789 000 111"})
    assert updated["phone"] == "+255789000111"
    assert customers.rows["c1"]["phone_verified"] is False
    assert messaging.sms[-1][0] == "+255789000111"
    assert updated["phone_otp_code"] in messaging.sms[-1][1]


async def test_password_reset_code_is_delivered_by_email():
    messaging = FakeMessaging()
    svc, _, otps = _service(messaging)
    await svc.register(_payload())
    out = await svc.request_password_reset("amina@example.com")
    assert out["otp_code"] in messaging.emails[-1][2]
    assert otps.issued[-1]["purpose"] == "PASSWORD_RESET"


async def test_invalid_channel_rejected():
    svc, _, _ = _service()
    await svc.register(_payload())
    with pytest.raises(ValidationError):
        await svc.request_otp("amina@example.com", "FAX")


def test_mask_destination_hides_most_of_the_contact():
    assert mask_destination("EMAIL", "amina@example.com") == "a****@example.com"
    masked = mask_destination("SMS", "+255754321987")
    assert masked.startswith("+255") and masked.endswith("987") and "7543" not in masked
