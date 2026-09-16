"""RBAC matrix — tests the real audiences that exist in FIXO-APP today.

Only two authenticated audiences actually exist: customer and provider
(separate JWT shapes, separate FastAPI dependencies — see
app/api/deps/auth.py and app/api/deps/provider_auth.py). There is no
support/finance/superadmin role and no admin route in this codebase —
testing those would test fiction. This suite covers what's real:
unauthenticated access, cross-audience token rejection, the internal
service-to-service key gate, and a coverage test that fails the build
the day a new route ships with no recorded RBAC expectation at all.

Route introspection note: the installed FastAPI (0.141.1 — the pinned
requirements.txt says 0.115.*, a real, separate drift worth fixing in its
own change) wraps every include_router() call in a fastapi.routing.
_IncludedRouter and applies the prefix lazily via
`_IncludedRouter.include_context.prefix` rather than baking it into each
route's own .path. `app.routes` at the top level is therefore NOT the
flattened route list — _flatten_routes() below walks it recursively,
accumulating prefixes, to get the real, full paths FastAPI actually
serves (395 routes under /api/v1/ today).
"""
from __future__ import annotations

from fastapi.routing import APIRoute, _IncludedRouter

from app.main import app

# pyproject.toml sets asyncio_mode = "auto" — every `async def test_*` here
# is picked up automatically, no explicit @pytest.mark.asyncio needed (and
# applying it as a blanket pytestmark would incorrectly tag the one
# synchronous coverage test below too).

# app/domains/providers/api/notifications_router.py registers its list route
# at "/" under prefix /providers/me/notifications, so the bare path 307s to
# the trailing-slash form — hit the real registered path directly rather
# than rely on httpx following the redirect.
_PROVIDER_NOTIFICATIONS = "/api/v1/providers/me/notifications/"


# -- real, unauthenticated access ---------------------------------------------------

async def test_health_endpoint_is_public(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200


async def test_customer_route_without_token_is_401(client):
    response = await client.get("/api/v1/notifications")
    assert response.status_code == 401


async def test_provider_route_without_token_is_401(client):
    response = await client.get(_PROVIDER_NOTIFICATIONS)
    assert response.status_code == 401


async def test_internal_route_without_key_is_401(client):
    response = await client.post(
        "/api/v1/internal/bookings/00000000-0000-0000-0000-000000000000/provider-events",
        json={"event": "ON_THE_WAY"},
    )
    assert response.status_code == 401


async def test_internal_route_with_wrong_key_is_401(client):
    response = await client.post(
        "/api/v1/internal/bookings/00000000-0000-0000-0000-000000000000/provider-events",
        json={"event": "ON_THE_WAY"},
        headers={"X-Internal-Key": "definitely-not-the-real-key"},
    )
    assert response.status_code == 401


# -- real audience boundaries ----------------------------------------------------

async def test_customer_can_reach_customer_route(client, as_customer):
    response = await client.get("/api/v1/notifications", headers=as_customer())
    assert response.status_code == 200


async def test_provider_can_reach_provider_route(client, as_provider):
    response = await client.get(_PROVIDER_NOTIFICATIONS, headers=as_provider())
    assert response.status_code == 200


async def test_provider_token_is_rejected_by_provider_route_check(client, as_customer):
    """A customer token has no "principal" claim; get_current_provider requires
    claims.get("principal") == "PROVIDER" and must reject anything else."""
    response = await client.get(_PROVIDER_NOTIFICATIONS, headers=as_customer())
    assert response.status_code == 401


async def test_customer_token_is_rejected_by_customer_route_when_audience_swapped(client, as_provider):
    """get_current_customer has no audience check of its own — it trusts
    "found a row in CUSTOMERS for this sub" as its only signal. A provider's
    sub will not resolve in CUSTOMERS, so this must still be rejected, but
    for a different reason (row not found, not claim mismatch) — worth
    documenting explicitly since the two auth dependencies are asymmetric."""
    response = await client.get("/api/v1/notifications", headers=as_provider())
    assert response.status_code == 401


# -- coverage: every registered route must have a recorded RBAC expectation ------

# Every entry here was verified against the real running app, not guessed
# from route names — see the "verified" note on each group.
_KNOWN_EXCEPTIONS = {
    # Genuinely public informational/content endpoints — verified no
    # customer/provider data is returned.
    ("GET", "/api/v1/health"): "public liveness endpoint",
    ("GET", "/api/v1/health/ready"): "public readiness endpoint",
    ("GET", "/api/v1/info"): "public build/version info",
    ("GET", "/api/v1/onboarding/steps"): "static onboarding step content",
    ("GET", "/api/v1/providers/onboarding/steps"): "static onboarding step content",
    ("GET", "/api/v1/public/landing"): "public marketing content",
    ("GET", "/api/v1/public/categories"): "public service catalogue",
    ("GET", "/api/v1/public/services"): "public service catalogue",
    ("GET", "/api/v1/public/services/search"): "public service catalogue search",
    ("GET", "/api/v1/public/faqs"): "public FAQ content",
    ("GET", "/api/v1/ratings/providers/{provider_id}/stars"): "public rating summary for a provider profile",
    ("GET", "/api/v1/providers/me/ranking/leaderboard"):
        "intentionally public despite the /me/ path segment — verified in "
        "registry.yaml: PROV.RANKING.LEADERBOARD sets requires_auth: false. "
        "The path is misleading (reads like personal data); worth renaming "
        "off /me/ in a follow-up, not a live auth gap.",

    # Pre-authentication flows — cannot require the token they're about to issue.
    ("POST", "/api/v1/auth/register"): "issues the token, cannot require one",
    ("POST", "/api/v1/auth/login"): "issues the token, cannot require one",
    ("POST", "/api/v1/auth/otp/request"): "pre-auth, issues an OTP",
    ("POST", "/api/v1/auth/otp/verify"): "pre-auth, verifies an OTP",
    ("POST", "/api/v1/auth/password/forgot"): "pre-auth password recovery",
    ("POST", "/api/v1/auth/password/reset"): "pre-auth password recovery",
    ("POST", "/api/v1/auth/token/refresh"): "exchanges a refresh token, not an access token",
    ("POST", "/api/v1/providers/auth/register"): "issues the token, cannot require one",
    ("POST", "/api/v1/providers/auth/login"): "issues the token, cannot require one",
    ("POST", "/api/v1/providers/auth/otp/request"): "pre-auth, issues an OTP",
    ("POST", "/api/v1/providers/auth/otp/verify"): "pre-auth, verifies an OTP",
    ("POST", "/api/v1/providers/auth/password/forgot"): "pre-auth password recovery",
    ("POST", "/api/v1/providers/auth/password/reset"): "pre-auth password recovery",
    ("POST", "/api/v1/providers/auth/token/refresh"): "exchanges a refresh token, not an access token",

    # Gated by a different, real mechanism than a customer/provider JWT.
    ("POST", "/api/v1/webhooks/integrations/swala/sms"):
        "gated by HMAC signature verification — see test_webhook_verification.py",
    ("POST", "/api/v1/internal/bookings/{booking_id}/provider-events"):
        "gated by X-Internal-Key — see test_internal_route_without_key_is_401",
    ("POST", "/api/v1/internal/scheduler/tick"): "gated by X-Internal-Key, same mechanism",

    # Verified NOT live: every handler here raises NotImplementedFeatureError
    # before touching a database row or a caller-supplied id (see
    # app/domains/{users,liabilities,transactions}/api/controller.py). No
    # exploitable exposure exists today, but no RBAC check exists either —
    # add get_current_customer/get_current_provider (as appropriate) and an
    # ownership check to each of these before its controller method is
    # actually implemented, not after.
    ("POST", "/api/v1/users"): "scaffold — UserController.create raises NotImplementedFeatureError",
    ("PATCH", "/api/v1/users/{user_id}"): "scaffold — UserController.update raises NotImplementedFeatureError",
    ("POST", "/api/v1/users/{user_id}/password"):
        "scaffold — UserController.change_password raises NotImplementedFeatureError",
    ("POST", "/api/v1/users/{user_id}/deactivate"):
        "scaffold — UserController.deactivate raises NotImplementedFeatureError",
    ("POST", "/api/v1/liabilities"):
        "scaffold — LiabilityController.create raises NotImplementedFeatureError",
    ("PATCH", "/api/v1/liabilities/{liability_id}"):
        "scaffold — LiabilityController.update raises NotImplementedFeatureError",
    ("POST", "/api/v1/liabilities/{liability_id}/payments"):
        "scaffold — LiabilityController.record_payment raises NotImplementedFeatureError",
    ("POST", "/api/v1/liabilities/{liability_id}/restructure"):
        "scaffold — LiabilityController.restructure raises NotImplementedFeatureError",
    ("POST", "/api/v1/transactions"):
        "scaffold — TransactionController.create raises NotImplementedFeatureError",
    ("PATCH", "/api/v1/transactions/{transaction_id}"):
        "scaffold — TransactionController.update raises NotImplementedFeatureError",
    ("POST", "/api/v1/transactions/{transaction_id}/settle"):
        "scaffold — TransactionController.settle raises NotImplementedFeatureError",
    ("POST", "/api/v1/transactions/{transaction_id}/categorize"):
        "scaffold — TransactionController.categorize raises NotImplementedFeatureError",
}


def _flatten_routes(routes: list, prefix: str = "") -> list[tuple[str, APIRoute]]:
    """Recursively resolve the real served path for every APIRoute.

    FastAPI 0.141's include_router() wraps sub-routers in _IncludedRouter
    and applies the prefix lazily via include_context.prefix rather than
    baking it into each nested route's own .path — app.routes at the top
    level is not the flattened list. This walks it properly.
    """
    out: list[tuple[str, APIRoute]] = []
    for route in routes:
        if isinstance(route, APIRoute):
            out.append((prefix + route.path, route))
        elif isinstance(route, _IncludedRouter):
            sub_prefix = prefix + (route.include_context.prefix or "")
            out.extend(_flatten_routes(route.original_router.routes, sub_prefix))
        elif hasattr(route, "routes"):
            out.extend(_flatten_routes(route.routes, prefix))
    return out


def _dependency_names(route: APIRoute) -> set[str]:
    names: set[str] = set()
    stack = list(route.dependant.dependencies)
    while stack:
        dep = stack.pop()
        if dep.call is not None:
            names.add(getattr(dep.call, "__name__", ""))
        stack.extend(dep.dependencies)
    return names


def test_every_api_v1_route_has_a_recorded_rbac_expectation():
    """A route added under /api/v1/ without get_current_customer,
    get_current_provider, or an entry in _KNOWN_EXCEPTIONS fails the build.
    This is what actually keeps the matrix from rotting — see handbook
    section 8.1's own reasoning for why the coverage test is the one that
    matters, not the matrix entries themselves.

    `_current_uploader` (app/api/v1/uploads.py) is also recognized: it's a
    real, legitimate third auth dependency — the generic upload/serve
    routes accept either a customer or a provider bearer token (their JWTs
    carry different claim shapes), so it can't just be
    get_current_customer/get_current_provider. It still requires and
    validates a real bearer token; it is not equivalent to no auth at all.
    """
    missing: list[str] = []
    for path, route in _flatten_routes(app.routes):
        if not path.startswith("/api/v1/"):
            continue
        deps = _dependency_names(route)
        authenticated = (
            "get_current_customer" in deps
            or "get_current_provider" in deps
            or "_current_uploader" in deps
        )
        for method in route.methods - {"HEAD", "OPTIONS"}:
            key = (method, path)
            if not authenticated and key not in _KNOWN_EXCEPTIONS:
                missing.append(f"{method} {path}")
    assert not missing, (
        "Routes with no get_current_customer/get_current_provider dependency and "
        "no recorded exception in _KNOWN_EXCEPTIONS — add one or the other:\n  "
        + "\n  ".join(sorted(missing))
    )
