"""Smoke tests: boot path, envelope shape, auth-gated routes."""
from __future__ import annotations


async def test_health_returns_standard_envelope(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["message"]["type"] == "success"
    assert body["data"]["status"] == "up"


async def test_info_reports_identity(client):
    response = await client.get("/api/v1/info")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["app"] == "FIXO-APP"


async def test_assets_route_requires_auth(client):
    # The assets domain used to be an intentional 501 scaffold reachable with
    # no auth at all (GetRequestContext never actually populated a user_id).
    # It's now wired to CurrentCustomer like every other customer domain, so
    # an unauthenticated request is correctly rejected before it ever reaches
    # business logic.
    response = await client.post(
        "/api/v1/assets",
        json={"name": "Laptop", "purchase_value": "1200.00"},
    )
    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
