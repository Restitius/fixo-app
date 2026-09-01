# // Phase 10 live smoke test - exercises reviews, warranties, favorites, rebook.
import json
import urllib.request

BASE = "http://127.0.0.1:8000/api/v1"
BOOKING = "a1addba9-c7db-48e7-bf7a-a8b62038d996"

from app.config import get_settings  # noqa: E402
from app.security.jwt import JwtService  # noqa: E402

s = get_settings()
svc = JwtService(
    s.secret_key,
    algorithm=s.jwt_algorithm,
    access_ttl_seconds=s.jwt_access_ttl_seconds,
    refresh_ttl_seconds=s.jwt_refresh_ttl_seconds,
)
TOKEN = svc.encode_access({"sub": "8ab3e010-f6b4-4287-ab6f-9539178d5167"})


def call(method, path, payload=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = json.loads(r.read())
            print(f"{method} {path} -> {r.status}: {json.dumps(body.get('data', body))[:220]}")
            return body
    except urllib.error.HTTPError as e:
        body = json.loads(e.read())
        print(f"{method} {path} -> {e.code}: {body.get('message', {}).get('body')}")
        return body


print("== Module 28: Reviews ==")
call("POST", "/reviews", {
    "booking_id": BOOKING, "service_id": "ignored",
    "provider_id": "ignored", "rating": 5,
    "comment": "Amani did an excellent job fixing the leak.",
})
mine = call("GET", "/reviews?entity_type=customer&entity_id=me&limit=5")
prov_id = None
if mine.get("data"):
    prov_id = mine["data"][0].get("provider_id")
    call("GET", f"/reviews?entity_type=service&entity_id={prov_id}&limit=5")
    call("GET", f"/reviews/stats/provider/{prov_id}")

print("== Module 29: Warranties ==")
w = call("GET", "/warranties?limit=5")
wid = w["data"][0]["warranty_id"] if w.get("data") else None
if wid:
    call("GET", f"/warranties/{wid}")

print("== Module 30: Favorites ==")
if prov_id:
    call("POST", f"/favorites/{prov_id}/toggle")
    call("GET", "/favorites?limit=5")

print("== Module 30b: Rebook ==")
call("GET", f"/bookings/{BOOKING}/rebook-preview")
rb = call("POST", f"/bookings/{BOOKING}/rebook")
