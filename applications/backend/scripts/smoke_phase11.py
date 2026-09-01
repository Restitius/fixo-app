# // Phase 11 live smoke - assets, recurring subscriptions, maintenance, scheduler.
import json
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

sys.path.insert(0, ".")

BASE = "http://127.0.0.1:8000/api/v1"
INTERNAL_KEY = "dev-internal-key"
CUSTOMER_ID = "8ab3e010-f6b4-4287-ab6f-9539178d5167"
AC_SERVICE = "00f3aa1e-bf48-4113-8aca-ba0695492d31"

from app.config import get_settings  # noqa: E402
from app.security.jwt import JwtService  # noqa: E402

s = get_settings()
svc = JwtService(s.secret_key, algorithm=s.jwt_algorithm,
                 access_ttl_seconds=s.jwt_access_ttl_seconds,
                 refresh_ttl_seconds=s.jwt_refresh_ttl_seconds)
TOKEN = svc.encode_access({"sub": CUSTOMER_ID})

yesterday = (date.today() - timedelta(days=1)).isoformat()
next_week = (date.today() + timedelta(days=7)).isoformat()


def call(method, path, payload=None, internal=False):
    headers = {"Content-Type": "application/json"}
    if internal:
        headers["X-Internal-Key"] = INTERNAL_KEY
    else:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers=headers,
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = json.loads(r.read())
            print(f"{method} {path} -> {r.status}: "
                  f"{json.dumps(body.get('data', body))[:170]}")
            return body
    except urllib.error.HTTPError as e:
        body = json.loads(e.read())
        print(f"{method} {path} -> {e.code}: {body.get('message', {}).get('body')}")
        return body


print("== Module 32: Asset ==")
asset = call("POST", "/assets", {
    "name": "Samsung AC 12000 BTU", "asset_type": "hvac",
    "brand": "Samsung", "purchase_value": 450000,
})
asset_id = asset["data"]["asset_id"]
call("GET", f"/assets/{asset_id}")
call("GET", "/assets/summary")

print("== Module 31: Recurring (due yesterday) ==")
sub = call("POST", "/recurring", {
    "service_id": AC_SERVICE, "frequency": "WEEKLY",
    "next_run_date": yesterday, "instructions": "Monthly AC check",
})
rid = sub["data"]["recurring_id"]
tick = call("POST", "/internal/scheduler/tick", {}, internal=True)
after = call("GET", f"/recurring/{rid}")
assert after["data"]["next_run_date"] > yesterday, "next_run_date did not advance"
assert after["data"]["last_request_id"], "no request generated"

print("== Module 31b: transitions ==")
call("POST", f"/recurring/{rid}/pause")
call("POST", f"/recurring/{rid}/resume")
call("DELETE", f"/recurring/{rid}")              # ACTIVE -> CANCELLED

print("== Module 33: Maintenance ==")
plan = call("POST", "/maintenance/plans", {
    "asset_id": asset_id, "service_id": AC_SERVICE,
    "interval_days": 180, "next_due_date": yesterday,
})
pid = plan["data"]["plan_id"]
call("POST", "/internal/scheduler/tick", {}, internal=True)  # sweep flags OVERDUE + notify
done = call("POST", f"/maintenance/plans/{pid}/done")
assert done["data"]["status"] == "ACTIVE" and done["data"]["next_due_date"], "mark_done failed"
call("GET", "/maintenance/plans?limit=5")

print("PHASE11 SMOKE OK")
