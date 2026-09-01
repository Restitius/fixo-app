# FIXO-APP Frontend

Placeholder for the FIXO-APP client application. This directory lives
alongside `applications/backend/` in the monorepo and will host the
frontend implementation that consumes the backend's `/api/v1/*` endpoints
(see `applications/backend/README.md` for the API contract, response
envelope, and screen-traceability conventions via the `X-Screen-ID` header).

Status: **NOT YET IMPLEMENTED** — no framework has been scaffolded here yet.

## Conventions to follow once implemented

- Send `X-Screen-ID` (matching `SCR-*` entries in
  `applications/backend/app/registries/screens`) on every request that maps
  to a tracked screen, per the backend's screen-traceability chain.
- Consume the standard response envelope
  (`success` / `message` / `data` / `meta` / `request_id`) returned by every
  backend endpoint; surface `error.code` / `error.details` on failures.
- Point API calls at the backend's `api_v1_prefix` (default `/api/v1`),
  configurable via the backend's `.env` (`CORS_ORIGINS` must include this
  app's dev origin).

## Suggested layout (once a framework is chosen)

    applications/frontend/
    |-- src/
    |-- public/
    |-- package.json
    |-- .env(.example)
    '-- README.md (this file)
