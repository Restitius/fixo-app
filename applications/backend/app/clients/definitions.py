"""Seed client definitions (CLT-*) — every frontend shell that talks to the API.

Attribution-only: these ids are used for observability, audit, analytics and
future rollouts/rate-limit keys — never for authorization.
"""
from __future__ import annotations

from app.registries.clients.client_definition import ClientDefinition

CLT_WEB_USER = ClientDefinition(
    id="CLT-WEB-USER",
    name="FIXO Web — Customer",
    kind="web",
    family="customer",
    description="Customer-facing web app (web-user, vite + tanstack).",
)

CLT_WEB_PROVIDER = ClientDefinition(
    id="CLT-WEB-PROVIDER",
    name="FIXO Web — Provider",
    kind="web",
    family="provider",
    description="Provider dashboard shell (web-provider, vite + tanstack).",
)

CLT_WEB_ADMIN = ClientDefinition(
    id="CLT-WEB-ADMIN",
    name="FIXO Web — Admin",
    kind="web",
    family="admin",
    description="Platform administration shell (web-admin, planned).",
)

CLT_WEB_UNKNOWN = ClientDefinition(
    id="CLT-WEB-UNKNOWN",
    name="FIXO Web — Unknown",
    kind="web",
    family="unknown",
    description="Browser/Web request without an explicit X-Client-ID header.",
)

CLT_MOBILE_ANDROID = ClientDefinition(
    id="CLT-MOBILE-ANDROID",
    name="FIXO Mobile — Android",
    kind="mobile",
    family="customer",
    description="Customer mobile app on Android (expo).",
)

CLT_MOBILE_IOS = ClientDefinition(
    id="CLT-MOBILE-IOS",
    name="FIXO Mobile — iOS",
    kind="mobile",
    family="customer",
    description="Customer mobile app on iOS (expo).",
)

CLT_API = ClientDefinition(
    id="CLT-API",
    name="FIXO Public API",
    kind="api",
    family="shared",
    description="Non-browser API consumers (integrations, partner systems).",
)

CLT_INTERNAL = ClientDefinition(
    id="CLT-INTERNAL",
    name="FIXO Internal",
    kind="internal",
    family="internal",
    description="Scheduler jobs, webhooks, internal/health endpoints, workers.",
)

CLT_UNKNOWN = ClientDefinition(
    id="CLT-UNKNOWN",
    name="FIXO Unknown Client",
    kind="unknown",
    family="unknown",
    description="Fallback when no client can be attributed (advisory header).",
)

ALL: tuple[ClientDefinition, ...] = (
    CLT_WEB_USER,
    CLT_WEB_PROVIDER,
    CLT_WEB_ADMIN,
    CLT_WEB_UNKNOWN,
    CLT_MOBILE_ANDROID,
    CLT_MOBILE_IOS,
    CLT_API,
    CLT_INTERNAL,
    CLT_UNKNOWN,
)