# FIXO-APP Backend

**FastAPI Implementation Structure v2** â€” domain-oriented, registry-driven,
query-governed, integration-independent, screen-traceable, event-driven,
observable, secure, and scalable.

This is the backend application of the FIXO-APP monorepo. It lives under
`applications/backend/` and is fully self-contained (its own dependency
manifest, Dockerfile, migrations, tests, and scripts). See the sibling
`applications/frontend/` for the client application, and the repository
root `README.md` for the monorepo overview.

Status: **SCAFFOLD** â€” every architectural component exists with typed
stubs; plumbing marked below is already functional.

---

## 1. Request lifecycle (the pattern every domain follows)

    Frontend (sends X-Screen-ID)
       |
       v
    Middleware stack ......... request/correlation ids, screen tracking, logging
       |
       v
    Route (domains/*/api/router.py)
       |
       v
    Controller ............... thin: request -> DTO -> service -> resource
       |
       v
    Request schema ........... validation (requests/)
       |
       v
    Policy / Authorization ... policies/ (+ API deps + SQL ownership filter)
       |
       v
    DTO ...................... dtos/ (internal transport)
       |
       v
    Application Service ...... services/ (use cases)  -- knows NO SQL/IDs/providers
       |-- Rules / Calculators (pure business math)
       |-- depends ONLY on app/ports (business-facing contracts)
       |
       v
    PORT ...................... app/ports/** (the contract the service sees)
       |
       v
    ADAPTER ................... app/adapters/**  -- query IDs + integration IDs live HERE
       |-- AssetSqlAdapter -> SQLQueryManager -> QueryRegistry -> ASSET.GET_BY_ID
       |-- PaymentAdapter -> IntegrationManager -> INT.PAYMENT.MOBILE_MONEY.V1
       |
       v
    PLATFORM MANAGER .......... app/platform/**  (validation, routing, policy)
       |
       v
    QUERY REGISTRY ............ stable IDs -> QueryDefinition
       |
       v
    QUERY LOADER -> SQL file (app/queries/**.sql)
       |
       v
    QUERY EXECUTOR -> DatabaseManager -> Driver -> ResultMapper
       |
       v
    Domain Event (EVT-*) --> EventBus --> Listeners
       |                                    |-- activity writes
       |                                    |-- notifications (NTF-*)
       |                                    '-- Kafka/RabbitMQ publish
       v
    Resource (responses/) -> Standard Envelope -> Frontend

## 2. The five systems ABOVE every domain

    RegistryManager
    |-- QueryRegistry         SQL governance (IDs -> governed .sql files)
    |-- IntegrationRegistry   external providers (INT-*)
    |-- ScreenRegistry        UI traceability (SCR-*)
    |-- EventRegistry + ListenerRegistry
    |-- JobRegistry           JOB-*
    |-- NotificationRegistry  NTF-*
    '-- CommandRegistry       CLI commands

Plus shared infrastructure: EventBus, structured Logging (correlation ids),
Audit (separate from logs!), Observability, multi-database DatabaseManager.

## 3. Directory map (condensed)

    WWW/FIXO-APP/applications/backend/
    |-- app/
    |   |-- main.py               tiny entrypoint (create_application())
    |   |-- bootstrap.py          ordered startup sequence
    |   |-- config.py             pydantic-settings over .env
    |   |-- api/                  deps, middleware, exceptions, responses, v1
    |   |-- domains/              assets | transactions | liabilities |
    |   |                         users | authentication | notifications
    |   |     (each: api requests responses dtos enums entities value_objects
    |   |           services port-facing repositories policies calculators
    |   |           messages events listeners notifications jobs commands rules tests)
    |   |-- registries/           manager + 7 registries
    |   |-- ports/                business-facing contracts (the ONLY domain dependency)
    |   |                         persistence/ integrations/ events/ queries/
    |   |                         notifications/ workflow/ pricing/ permissions/
    |   |                         files/ search/ cache/ audit/
    |   |-- adapters/             ID+manager layer (persistence/ integrations/)
    |   |-- platform/             managers (query/ integrations/ events/ notifications/
    |   |                         screens/ audit/ commands/ workflow/ pricing/
    |   |                         permissions/ files/ search/ cache/ jobs/
    |   |                         scheduler/ registry/)
    |   |-- definitions/          declarative governed definitions (queries/ workflows/
    |   |                         integrations/ notifications/ pricing/ permissions/)
    |   |-- queries/              registry.yaml + governed SQL ONLY place for SQL
    |   |-- integrations/         manager, contracts, providers, clients...
    |   |-- infrastructure/       database(+drivers) cache messaging storage search
    |   |-- security/             authn authz jwt password permissions roles
    |   |                         ownership tenant encryption secrets
    |   |-- events/ notifications/ jobs/ scheduler/ commands/ screens/
    |   |-- logging/ audit/ observability/ contracts/ shared/ startup/
    |-- migrations/               alembic (raw-DDL friendly)
    |-- scripts/                  bootstrap start start_worker start_scheduler migrate seed
    |-- tests/                    unit integration api contract security performance architecture
    |-- storage/                  logs exports imports temporary generated

## 4. Stable ID conventions

| Kind          | Format example     | Lives in                          |
|---------------|--------------------|-----------------------------------|
| Screen        | SCR-AST-001        | registries/screens                |
| Client        | CLT-WEB-PROVIDER   | registries/clients                |
| Query         | ASSET.GET_BY_ID    | queries/registry.yaml + query_ids |
| Integration   | INT-PAY-001        | registries/integrations           |
| Event         | EVT-AST-CREATED    | domains/*/events                  |
| Job           | JOB-AST-REVALUE    | domains/*/jobs                    |
| Notification  | NTF-AST-CREATED    | domains/*/notifications           |

Traceability chain: SCR-AST-001 -> GET /api/v1/assets -> ASSET.LIST ->
find_asset.sql -> EVT-AST-CREATED -> listeners -> NTF-AST-CREATED.

### Client shell attribution (X-Client-ID / X-Client-Version)

Every request is attributed to the frontend shell that originated it via the
`X-Client-ID` header (a `CLT-*` id, e.g. `CLT-WEB-PROVIDER`) plus
`X-Client-Version`. The `ClientContextMiddleware` resolves these into a
`ClientContext` that flows into logs, `RequestContext`, `EventContext` and the
job-origin helper (`app/platform/origin.py`). This is an **attribution** axis —
it answers "which application did this?" in logs/events/audit/jobs — and is
**never** an authorization control. Missing/unknown ids fall back to
`CLT-UNKNOWN` so no request is ever rejected; enforcement stays with RBAC +
ownership rules.

Chain: `CLT-WEB-PROVIDER` -> `SCR-PRV-...` -> `PRV.BOOKING.LIST` -> rows.

See `docs/client-attribution-implementation.md` for the full reference.

## 5. Standard response envelope

    {
      "success": true,
      "message": { "type": "success", "title": "Asset created",
                   "body": "Your asset has been created successfully." },
      "data": {},
      "meta": {},
      "request_id": "req-..."
    }

Errors add: "error": { "code": "...", "details": {...} }.
Unimplemented features return HTTP 501 with code FEATURE.NOT_IMPLEMENTED.

## 6. Quickstart

All commands below assume your shell is at `applications/backend/`
(i.e. `cd applications/backend` from the repository root first).

    # Bash/WSL/Git-Bash
    scripts/bootstrap.sh
    source .venv/bin/activate
    scripts/start.sh            # http://localhost:8000/docs

    # Dedicated container stack (isolated per component, no port clashes)
    docker compose up -d --build   # postgres:5434, redis:6370, api:8000
    alembic upgrade head           # apply raw-DDL (CAPITAL table) migrations
    python -m uvicorn app.main:app --port 8000   # or run via docker compose

    # Or everything containerized
    docker compose up --build

    # Tests (kernel plumbing runs for real; feature suites are skipped)
    pytest

Windows PowerShell equivalents:
    cd applications\backend
    python -m venv .venv; .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    uvicorn app.main:app --reload

## 7. Implementation status

| Area                                   | State                                        |
|----------------------------------------|----------------------------------------------|
| Response envelope, pagination, errors  | IMPLEMENTED (pure plumbing)                  |
| Registries (all 7) + RegistryManager   | IMPLEMENTED mechanics                        |
| Query registry load+validate at boot   | IMPLEMENTED (YAML manifest enforced)         |
| Exception handlers -> envelope         | IMPLEMENTED                                  |
| Request/correlation/screen middleware  | IMPLEMENTED (pure ASGI)                      |
| Logging context (contextvars)          | IMPLEMENTED                                  |
| Ownership assertion + scoped params    | IMPLEMENTED                                  |
| Value objects, rules, calculators(pure)| IMPLEMENTED where trivially pure             |
| QueryExecutor -> DB, sessions, txns    | IMPLEMENTED (raw SQL, CAPITAL tables, Postgres)|
| JWT/password/auth flows                | IMPLEMENTED (register + OTP + login + refresh)|
| Integrations execution pipeline        | SCAFFOLD                                     |
| Jobs queue backend, Scheduler loop     | SCAFFOLD                                     |
| Notification delivery channels         | SCAFFOLD                                     |
| Audit persistence                      | SCAFFOLD                                     |

## 8. Adding a new domain (mandatory checklist, section 40)

For every substantial module review/implement:

    Router, Controller, Request schemas, Authorization dependency, Policies,
    DTOs, Enums, Entities/value objects, Application service, Domain service,
    Query service, Query IDs, Query registry entries, SQL files,
    Response resources, Collections, Calculators, Rules, Messages,
    Domain events, Listeners, Persistent notifications, Jobs, Scheduler links,
    Commands, Startup registration, Deduplication, Alert lifecycle,
    Secure ownership filtering (SQL AND user_id = :user_id), Audit logging,
    Component logging, Tests, Consistent API response.

Copy the assets domain as the reference; register new pieces in the matching
startup/register_*.py step.

## 9. Non-negotiable rules

1. NO SQL outside app/queries/**.sql (validator enforces ownership filters).
2. Services never touch HTTP objects; controllers never touch SQL/providers.
3. Side effects belong to LISTENERS, never inline in services.
4. External systems ONLY through IntegrationManager.execute(INT-ID,...).
5. Every mutating action emits a domain event; audit != logging.
6. Correlation ID must appear end-to-end in every log line.

## 10. Layered architecture and the golden rule (official)

The dependency direction is ALWAYS outward-to-inward:

    Presentation (api/) -> Application (domains/*/services) -> Domain (entities,
    rules, calculators) -> PORTS (app/ports/) -> ADAPTERS (app/adapters/)
    -> MANAGERS (app/platform/) -> REGISTRIES (app/registries/) -> INFRASTRUCTURE

Application/domain code must NOT know where SQL, integrations, workflows,
notifications, files, providers or registry definitions live. Concretely,
`AssetService` never calls `SQLQueryManager.execute("ASSET.GET_BY_ID", ...)`:
the query ID exists only inside `AssetSqlAdapter` (app/adapters/persistence),
which implements the `AssetRepository` port that `AssetService` actually sees.

| Layer                  | Manager | Registry | SQL / provider implementation |
|------------------------|---------|----------|-------------------------------|
| Controller             |  nope   |  nope    | nope                          |
| Application service    |  nope*  |  nope    | nope                          |
| Domain (entities/rules)|  nope   |  nope    | nope                          |
| Ports (contracts)      |  nope   |  nope    | nope                          |
| Adapters               |  yes    |  nope    | via managers only             |
| Managers (platform)    |  —      |  yes     | yes                           |
| Infrastructure         |  yes    | controlled| yes                           |

\* Only genuine business facades (e.g. a booking workflow facade) may be exposed;
  infrastructure managers stay hidden.

The real (reference) flows therefore become:

    AssetService -> AssetRepository(PORT) -> AssetSqlAdapter(ADAPTER)
                 -> SQLQueryManager -> QueryRegistry -> QueryDefinition
                 -> QueryExecutor -> DatabaseManager -> Database

    PaymentService -> PaymentGateway(PORT) -> PaymentIntegrationAdapter(ADAPTER)
                   -> IntegrationManager -> IntegrationRegistry -> Provider

Architecture guard tests in `tests/architecture/` fail CI if a `domains/` or
`ports/` file imports `platform/`, `registries/`, `infrastructure/`,
`integrations/`, `queries/`, or `definitions/`; if `platform/` imports
`domains/`; if a `domains/*/services` file references a manager/registry
symbol; or if governed query IDs appear anywhere outside `app/adapters/`.

Compatibility shims keep older import paths alive during the transition:
`domains/assets/queries/asset_query_service.py`, `query_ids.py`, and
`domains/assets/repositories/asset_repository.py` now re-export the canonical
adapter/port definitions from `app/adapters/` and `app/ports/`.

