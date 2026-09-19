"""Security response headers — asserted once, centrally, on every API response.

Before this suite (and its companion app/api/middleware/security_headers.py,
added alongside it): none of these headers were set on any response —
confirmed directly against a real GET /api/v1/health call before writing
either file. This is exactly the "day one, this fails, that's the useful
part" finding the handbook describes for the architecture/security
suites — except headers are a small, safe, self-contained fix (unlike
the RBAC-scaffold gaps in test_rbac_matrix.py, which need a real
authorization decision per domain), so the fix shipped with the test
rather than being left as a followup.
"""
from __future__ import annotations

EXPECTED = {
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "cache-control": "no-store",
}


async def test_security_headers_present_on_public_response(client):
    response = await client.get("/api/v1/health")
    for header, value in EXPECTED.items():
        assert response.headers.get(header) == value, f"missing or wrong: {header}"


async def test_security_headers_present_on_error_response(client):
    """Headers must appear even when ExceptionHandlingMiddleware produces
    the response — a 401 here, from an unauthenticated request to a
    customer-only route."""
    response = await client.get("/api/v1/notifications")
    assert response.status_code == 401
    for header, value in EXPECTED.items():
        assert response.headers.get(header) == value, f"missing or wrong: {header}"


async def test_errors_do_not_leak_internals(client):
    response = await client.get("/api/v1/notifications")
    body = response.text.lower()
    for leak in ("traceback", "sqlalchemy", "asyncpg", "psycopg", 'file "/'):
        assert leak not in body
