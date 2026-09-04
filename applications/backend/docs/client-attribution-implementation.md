# FIXO Client Attribution — Implementation Reference

> **One FIXO application, four frontend shells, one shared backend.** Customer,
> Provider, Admin and Mobile hit the same API. The only difference per surface
> is *what RBAC lets them see and do* — and, for observability, *which shell*
> performed the request. This document defines the additive **Client Shell
> Attribution** axis that makes "which frontend component is the backend" an
> answerable question in logs, events, audit and jobs.
>
> **Status: IMPLEMENTED end-to-end (backend + frontend headers) on `dev`.**
> Commits `d36407a`…`26c53e0` (+ this doc). Tag: `client-attribution-v1`.
> Purely additive — no existing flow, route, or domain logic was changed.

---

## 1. The model

| Shell              | Backend folder / origin | `X-Client-ID` | `kind` | `family` |
|--------------------|------------------------|---------------|--------|----------|
| Customer web       | `web/web-user`         | `CLT-WEB-USER` | web    | customer |
| Provider web       | `web/web-provider`     | `CLT-WEB-PROVIDER` | web | provider |
| Admin web          | `web/web-admin` (future)| `CLT-WEB-ADMIN` | web   | admin |
| Mobile (Android)   | `mobile`               | `CLT-MOBILE-ANDROID` | mobile | customer |
| Mobile (iOS)       | `mobile`               | `CLT-MOBILE-IOS` | mobile | customer |
| Public API         | —                      | `CLT-API`      | api    | shared |
| Internal (worker/webhook) | scheduler/jobs      | `CLT-INTERNAL` | internal | internal |
| Fallback           | —                      | `CLT-UNKNOWN`  | unknown | unknown |
| Inherited web (no header) | any browser         | `CLT-WEB-UNKNOWN` | web | unknown |

> **Golden rule:** `X-Client-ID` is **attribution** — never authorization. It
> feeds logs, events, audit, analytics, rate-limit keys and rollouts. A forged
> header gains nothing; RBAC + ownership assertions at route/service/query are
> the enforcement point.

---

## 2. Wire / data flow

    Request (X-Client-ID, X-Client-Version, X-Screen-ID)
       |
       v
    ClientContextMiddleware -> ClientTracker -> ClientRegistry (CLT-*)
       |                        scope["state"]["client_context"] (ClientContext)
       v
    Log context (client_id/kind/family/version) + RequestContext fields
       v
    Domain service emits DomainEvent
       |   EventBus.publish() auto-fills EventContext from log snapshot
       v
    Event listeners / Job enqueue (app/platform/origin.py capture_origin())

---

## 3. Header contract

| Header               | Example            | Purpose                             |
|----------------------|--------------------|-------------------------------------|
| `X-Client-ID`        | `CLT-WEB-PROVIDER` | which shell (registry `CLT-*` id)   |
| `X-Client-Version`   | `1.2.0`            | build/deploy version for rollouts    |
| `X-Screen-ID`        | `SCR-PRV-001`      | which screen (existing)             |
| `X-Request-ID` / `X-Correlation-ID` | —     | traceability (existing)             |

---

## 4. Phases & status

| Phase | Scope | Status | Commit |
|-------|-------|--------|--------|
| P0    | Baseline — record pre-existing suite state | ✅ | — |
| P1    | Client registry (`CLT-*`), headers, startup | ✅ | `d36407a` |
| P2    | `ClientContextMiddleware` wired into app | ✅ | `295fce1` |
| P3    | Propagation — logs / `RequestContext` / `EventContext` / `EventBus` auto-fill / job origin | ✅ | `21aff03` |
| P4    | Screen axis — `ScreenDefinition.clients` + registry lookups | ✅ | `65d34cd` |
| P5    | Tests (unit + propagation) | ✅ | `56749f4` |
| Phase F | Frontend headers (web-user, mobile, web-provider) | ✅ | `26c53e0` |
| P6    | Docs (this file + READMEs) | ✅ | this commit |

### P1 — Registry & headers (P1 files)

- `app/shared/constants/headers.py` — `HEADER_CLIENT_ID`, `HEADER_CLIENT_VERSION`.
- `app/registries/clients/client_definition.py` — `ClientDefinition(id, name, kind, family, description)`.
- `app/registries/clients/client_registry.py` — register/get/exists/`find_by_family`/all/count (mirrors `ScreenRegistry`).
- `app/clients/definitions.py` — seed `ALL` (`CLT-*`).
- `app/clients/context.py` — `ClientContext`.
- `app/clients/tracker.py` — `ClientTracker.resolve(id, version)` with `CLT-UNKNOWN` fallback.
- `app/registries/registry_manager.py` — `self.clients` + summary count.
- `app/startup/register_clients.py` — load definitions.
- `app/bootstrap.py` — `register_clients` startup step.

### P2 — Middleware (P2 files)

- `app/api/middleware/client_context.py` — header → `ClientContext` → state + log bind; fallbacks
  (`/internal*` → `CLT-INTERNAL`, browser UA without header → `CLT-WEB-UNKNOWN`, else `CLT-UNKNOWN`).
- `app/startup/application.py` — `ClientContextMiddleware` added to the stack (beside `ScreenTrackingMiddleware`).
- `app/api/middleware/__init__.py` — docstring updated.

### P3 — Propagation (P3 files)

- `app/logging/context.py` — 4 new contextvars: `client_id`, `client_kind`, `client_family`, `client_version`.
- `app/api/deps/request_context.py` — `RequestContext` +4 fields (`default=""`), populated from `client_context`.
- `app/events/event.py` — `EventContext` + `client_id`, `client_version`.
- `app/events/event_bus.py` — `publish()` back-fills missing context from the log snapshot
  (every existing event class carries shell attribution with **zero** domain-file changes).
- `app/platform/origin.py` — `capture_origin()` snapshot for job enqueue / async handoff.

### P4 — Screen axis (P4 files)

- `app/registries/screens/screen_definition.py` — `clients: tuple[str, ...] = ()` (empty = shared).
- `app/registries/screens/screen_registry.py` — `find_by_client`, `find_by_client_and_route`.
- `app/registries/screens/screen_permissions.py` — `visible_for_client(granted, screen, client_id)`.

### P5 — Tests (P5 files)

- `tests/unit/test_client_registry.py` — seed/duplicate/get/find_by_family/tracker fallbacks.
- `tests/unit/test_client_context.py` — middleware resolution + fallbacks + log binding + app-factory smoke.
- `tests/unit/test_client_event_propagation.py` — `EventBus` auto-fill, explicit-context precedence,
  `capture_origin`, screen client axis, `visible_for_client`.

### Phase F — Frontend (Phase F files)

- `web/web-user/src/lib/api-client.ts` — `CLIENT_ID="CLT-WEB-USER"`, `X-Client-ID/Version` headers.
- `mobile/lib/api-client.ts` — platform-aware id via `expo-constants` → `CLT-MOBILE-ANDROID`/`CLT-MOBILE-IOS`.
- `web/web-provider/src/lib/api-client.ts` — scaffolded client with `CLT-WEB-PROVIDER` headers.

---

## 5. Verification

- `cd applications/backend && python -m pytest` → **40 passed, 4 skipped**;
  the only failure (`tests/api/test_health.py::test_info_reports_identity`) is a
  **pre-existing environment mismatch** (`app_name` resolves to `fixo-dev` here vs
  the asserted `FIXO-APP`) and is unrelated to this change.
- Frontend type-checks: `web-user`, `web-provider`, `mobile` all `tsc --noEmit` exit 0.

---

## 6. Future hooks (when RBAC / navigation land)

1. `/me/context` response adds `current_client` alongside roles/permissions/active_context.
2. `NavigationEngine` builds the sidebar from `ScreenRegistry` client-aware lookups + permissions.
3. Audit persistence records `client_id` from `RequestContext`.
4. Rollouts / rate-limit keys keyed on `client_kind` / `client_family`.
5. Strict mode via `STRICT_CLIENT_MODE` env once every shell ships headers.