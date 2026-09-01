"""Smoke tests: boot path, envelope shape, scaffold 501 contract."""
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


async def test_stub_route_returns_501_envelope(client):
    response = await client.post(
        "/api/v1/assets",
        json={"name": "Laptop", "purchase_value": "1200.00"},
    )
    assert response.status_code == 501
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "FEATURE.NOT_IMPLEMENTED"
