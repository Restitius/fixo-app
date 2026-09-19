"""Phase 13 smoke test against the live API (http://127.0.0.1:8000).
Run: python scripts/smoke_phase13.py"""
import random
import string
import sys

import httpx

BASE = "http://127.0.0.1:8000/api/v1"
results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + (f" | {detail}" if detail else ""))


def data(r):
    try:
        j = r.json()
    except Exception:
        return {}
    if isinstance(j, dict) and "data" in j:
        return j["data"]
    return j


def authed_client():
    s = httpx.Client(base_url=BASE, timeout=20)
    email = "p13_" + "".join(random.choices(string.ascii_lowercase, k=8)) + "@test.tz"
    pw = "Passw0rd!234"
    s.post("/auth/register", json={"email": email, "password": pw, "first_name": "P13", "last_name": "Tester"})
    r = s.post("/auth/otp/request", json={"email": email})
    code = (data(r) or {}).get("code") or (data(r) or {}).get("otp_code")
    if not code:
        print("NOTE: OTP code not returned in dev response; trying login")
    else:
        s.post("/auth/otp/verify", json={"email": email, "code": code})
    r = s.post("/auth/login", json={"email": email, "password": pw})
    tok = (data(r) or {}).get("access_token")
    if not tok:
        print("AUTH FAILED:", r.status_code, r.text[:200])
        sys.exit(1)
    s.headers["Authorization"] = f"Bearer {tok}"
    return s


s = authed_client()

# --- SUPPORT (needs nothing but auth) ---
r = s.post("/support/create", json={"subject": "Refund question", "message": "Where is my refund?"})
ticket = data(r)
check("support.create", r.status_code in (200, 201), str(ticket)[:120])
tid = (ticket or {}).get("ticket_id") or (ticket or {}).get("id")
if tid:
    r = s.post("/support/add_message", json={"ticket_id": tid, "message": "Any update?"})
    check("support.add_message", r.status_code in (200, 201))
r = s.get("/support/list")
check("support.list", r.status_code == 200)

# --- DISPUTES (needs a booking) ---
r = s.get("/bookings/list")
bookings = data(r)
rows = bookings if isinstance(bookings, list) else bookings.get("items") or bookings.get("bookings") or []
closed = next((b for b in rows if (b.get("status") or "").upper() in ("CLOSED", "PAID")), None)
if closed:
    bid = closed.get("booking_id") or closed.get("id")
    r = s.post("/disputes/create", json={"booking_id": bid, "reason": "Work not completed", "details": "Arrived late, left early"})
    check("disputes.create", r.status_code in (200, 201), r.text[:120])
    r = s.get("/disputes/list")
    check("disputes.list", r.status_code == 200)
else:
    check("disputes (skipped: no CLOSED/PAID booking for fresh user)", True, "SKIPPED")

# --- CANCELLATION (needs an active booking) ---
active = next((b for b in rows if (b.get("status") or "").upper() in ("CONFIRMED", "PAYMENT_AUTHORIZED")), None)
if active:
    bid = active.get("booking_id") or active.get("id")
    r = s.post("/cancellations/preview", json={"booking_id": bid})
    check("cancellations.preview", r.status_code in (200, 201), r.text[:120])
    r = s.post("/cancellations/cancel", json={"booking_id": bid, "reason": "Plans changed"})
    check("cancellations.cancel", r.status_code in (200, 201), r.text[:120])
else:
    check("cancellations (skipped: no cancelable booking for fresh user)", True, "SKIPPED")

fails = [r for r in results if not r[1]]
print(f"\nSUMMARY: {len(results) - len(fails)}/{len(results)} passed, {len(fails)} failed")
sys.exit(1 if fails else 0)
