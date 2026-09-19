# HANDYMAN Application Reference Document

> **FastAPI Implementation Structure v2** — domain-oriented, registry-driven, query-governed, integration-independent, screen-traceable, event-driven, observable, secure, and scalable.
>
> **Status: Phase 0 Foundation + Phase 1 (Public / Authentication / Onboarding) IMPLEMENTED — running on a dedicated Docker stack (Postgres:5434, Redis:6370, API:8000).**

---

## Dedicated Local Stack (Docker Compose)

Each FIXO-APP component runs in its own, isolated container (`fixo-*`), **separate from every other project** on the machine:

| Component | Container | Host port |
|-----------|-----------|-----------|
| PostgreSQL | `fixo-postgres` | `5434` |
| Redis | `fixo-redis` | `6370` |
| FastAPI | `fixo-api` | `8000` |
| Worker | `fixo-worker` | — |
| Scheduler | `fixo-scheduler` | — |

```bash
cd applications/backend
docker compose up -d --build        # bring up everything
docker compose up -d postgres redis # DB + cache only (fast dev loop)
alembic upgrade head                # apply migrations (raw DDL, CAPITAL tables)
```

**Conventions enforced:**
- All table names are CAPITAL (quoted in Postgres DDL, e.g. `"CUSTOMERS"`).
- All queries are RAW SQL files under `app/queries/*.sql` — no ORM entities.
- All comments in SQL use `--` (never shebang/`//`).
- DB-side logic (e.g. OTP issue/verify) lives in PL/pgSQL functions (`SP_ISSUE_OTP`, `SP_VERIFY_OTP`) so registry queries stay thin and atomic.
- Database, cache, worker, scheduler and API are separate containers.

---

## 1. Architectural Foundation (Phase 0)

### 1.1 The Five Layers

```text
┌───────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                     │
│   Screens / API / Controllers / Middleware / WebSockets   │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                      │
│  Use Cases / Commands / Application Services / DTOs       │
│                                                           │
│  DOES NOT KNOW SQL, REDIS, KAFKA, M-PESA, TWILIO, etc.    │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                        │
│ Entities / Rules / Policies / Value Objects / Events      │
│ Workflow rules / Pricing rules                            │
└──────────────────────────┬────────────────────────────────┘
                           │
                      PORTS / CONTRACTS
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│                    PLATFORM LAYER                         │
│ Managers / Registries / Engines / Dispatchers             │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                     │
│ SQL / DB / Redis / Kafka / HTTP / Maps / SMS / Payments   │
└───────────────────────────────────────────────────────────┘
```

### 1.2 The Golden Rule

Dependency direction is ALWAYS:

```text
Presentation → Application → Domain → Ports
    ↑                                   │
    │                                   ▼
    ← Adapters → Managers → Infrastructure
```

**Never:**
- Domain Service → PostgreSQL
- BookingService → M-PesaAdapter
- HomeService → QueryRegistry
- PaymentService → IntegrationRegistry
- NotificationService → Twilio

### 1.3 Three Levels of Isolation

**Level 1 — Domain/Application Port**

The application sees business-meaningful operations only:

```python
class BookingRepositoryPort:
    async def create(...)
    async def find_by_id(...)
    async def list_customer_bookings(...)
```

No SQL IDs.

**Level 2 — Infrastructure Adapter**

The adapter translates business operations into registered infrastructure operations:

```python
class SQLBookingRepository(BookingRepositoryPort):
    async def find_by_id(self, booking_id, customer_id):
        return await self.sql_manager.execute(
            QueryIds.BOOKING_FIND_BY_ID,  # ID lives here only
            {"booking_id": booking_id, "customer_id": customer_id},
            fetch="one",
        )
```

**Level 3 — Manager + Registry**

```text
SQLBookingRepository → SQLQueryManager → QueryRegistry → QueryDefinition
  → SQL Loader → QueryExecutor → DatabaseManager → Database
```

The query registry is completely invisible to the application layer.

### 1.4 The Real Query Flow

```text
HomeApplicationService → HomeReadPort → HomeReadAdapter
  → SQLQueryManager → QueryRegistry → QueryDefinition
  → QueryExecutor → DatabaseManager → Database
```

### 1.5 Integration Architecture (Same Pattern)

```text
PaymentApplicationService → PaymentGatewayPort → PaymentIntegrationAdapter
  → IntegrationManager → IntegrationRegistry → Provider Adapter → External Provider
```

Application layer knows only: `authorize_payment()`, `capture_payment()`, `refund_payment()`.

It does NOT know: M-Pesa, Airtel Money, Stripe, Flutterwave, Pesapal.

### 1.6 Internal vs External Integrations

**External integration IDs:**
```
INT.PAYMENT.MOBILE_MONEY.V1
INT.PAYMENT.CARD.V1
INT.EMAIL.TRANSACTIONAL.V1
INT.SMS.TRANSACTIONAL.V1
INT.MAPS.GEOCODE.V1
INT.MAPS.ROUTING.V1
INT.STORAGE.OBJECTS.V1
INT.IDENTITY.OTP.V1
INT.PUSH.CUSTOMER.V1
```

**Internal integration IDs:**
```
INT.INTERNAL.WALLET.RESERVE.V1
INT.INTERNAL.CUSTOMER.CREATE.V1
INT.INTERNAL.REQUEST.VALIDATE.V1
CMD.WALLET.RESERVE.V1
```

Cross-domain calls never hit another domain's database directly. They go through ports + internal integrations + command bus.

---
## 2. Platform Layer — Phase 0 Components

| Manager | Location | Status |
|---------|----------|--------|
| `SQLQueryManager` | `app/platform/query/sql_query_manager.py` | ✅ Complete |
| `DatabaseManager` | `app/infrastructure/database/manager.py` | ✅ Complete |
| `QueryRegistry` / `QueryDefinition` / `QueryLoader` / `QueryValidator` | `app/registries/queries/` | ✅ Complete |
| `RegistryManager` | `app/platform/registry/registry_manager.py` | ✅ Complete |
| `IntegrationManager` | `app/platform/integrations/integration_manager.py` | ✅ Complete |
| `InternalIntegrationManager` | `app/platform/integrations/internal_manager.py` | ✅ Complete |
| `ExternalIntegrationManager` | `app/platform/integrations/external_manager.py` | ✅ Complete |
| `IntegrationRegistry` / `IntegrationDefinition` | `app/registries/integrations/` | ✅ Complete |
| `EventManager` | `app/platform/events/event_manager.py` | ✅ Complete |
| `EventRegistry` / `ListenerRegistry` | `app/registries/events/` | ✅ Complete |
| `CommandManager` / `CommandBus` | `app/integrations/internal/` | ✅ Complete |
| `WorkflowManager` | `app/platform/workflow/workflow_manager.py` | ✅ Complete |
| `WorkflowRegistry` | `app/registries/workflows/` | ✅ Complete |
| `PermissionManager` / `OwnershipManager` | `app/platform/permissions/` | ✅ Complete |
| `AuditManager` | `app/platform/audit/` | ✅ Complete |
| `ScreenManager` / `ScreenRegistry` | `app/platform/screens/`, `app/screens/` | ✅ Complete |
| `NotificationManager` | `app/platform/notifications/` | ✅ Complete |
| `FileManager` | `app/platform/files/` | ✅ Complete |
| `CacheManager` | `app/platform/cache/` | ✅ Complete |
| `SearchManager` | `app/platform/search/` | ✅ Complete |
| `JobManager` | `app/platform/jobs/` | ✅ Complete |
| `SchedulerManager` | `app/platform/scheduler/` | ⚠️ Pending activation |
| `FeatureManager` | `app/platform/features/` | ⚠️ Not yet implemented |
| `Composition Root` | `app/startup/composition.py` | ✅ Complete |
| `Bootstrap` | `app/bootstrap.py` | ✅ Complete |

### Request Context & Observability

Every request carries:
- `request_id` — unique per HTTP request
- `correlation_id` — propagates across service/event boundaries
- `trace_id` — links to distributed tracing
- `screen_id` — `X-Screen-ID` header from frontend
- `customer_id` — authenticated principal
- `session_id`, `device_id`, `tenant_id`, `ip_address`, `user_agent`, `locale`, `currency`, `timezone`

### Bootstrap Sequence

```text
Load Configuration → Initialize Logging → Initialize Database
  → Register Queries → Register Integrations → Register Screens
  → Register Events → Register Listeners → Register Jobs
  → Register Notifications → Register Scheduler → Register Platform
    → Register API Routes
```

---

## 3. The 34-Step Implementation Template

Every module follows these steps in order:

| Step | What | Where |
|------|------|-------|
| 1 | **Domain Definition** | `application/<module>/` |
| 2 | **Entities** | `application/<module>/<domain>/entities/` |
| 3 | **Value Objects** | `application/<module>/<domain>/value_objects/` |
| 4 | **Enums** | `application/<module>/<domain>/enums/` |
| 5 | **Business Rules** | `application/<module>/<domain>/rules/` |
| 6 | **Domain Events** | `application/<module>/<domain>/events/` |
| 7 | **Ports/Contracts** | `app/ports/` |
| 8 | **Application Commands** | `application/<module>/commands/` |
| 9 | **Application Queries** | `application/<module>/queries/` |
| 10 | **DTOs** | `application/<module>/dtos/` |
| 11 | **Service/Handlers** | `application/<module>/services/` |
| 12 | **Persistence Adapter** | `app/adapters/persistence/<domain>_sql_adapter.py` |
| 13 | **Query IDs** | In adapter, as constants |
| 14 | **SQL Files** | `app/queries/<domain>/...` |
| 15 | **Query Registry Entries** | `app/queries/registry.yaml` |
| 16 | **Integration Adapters** | `app/integrations/internal/...` or `app/integrations/external/...` |
| 17 | **Integration Registry Entries** | `app/startup/register_integrations.py` |
| 18 | **Workflow Definition** | `app/registries/workflows/<domain>_workflow.py` |
| 19 | **Event/Listener Registration** | `app/startup/register_events.py` |
| 20 | **Notification Definitions** | `app/registries/notifications/` |
| 21 | **Policies/Permissions** | `app/permissions/` |
| 22 | **Screen Registrations** | `app/screens/definitions/<domain>.py` |
| 23 | **Controller** | `app/domains/<domain>/api/controller.py` |
| 24 | **Request Validation** | `app/domains/<domain>/api/requests.py` |
| 25 | **Response Resources** | `app/domains/<domain>/api/responses.py` |
| 26 | **API Route** | `app/api/v1/<domain>.py` |
| 27 | **Jobs/Scheduler** | `app/platform/jobs/<domain>_jobs.py` |
| 28 | **Audit Rules** | `app/audit/` |
| 29 | **Logging/Metrics/Tracing** | Inferred from platform managers |
| 30 | **Unit Tests** | `tests/unit/` |
| 31 | **Integration Tests** | `tests/integration/` |
| 32 | **Contract Tests** | `tests/contract/` |
| 33 | **Architecture Tests** | `tests/architecture/` |
| 34 | **Documentation** | `docs/phase<X>_<domain>.md` |

### Note on Reference Implementation

The `assets` domain is the complete reference template. Every new module copies this structure exactly:

```
app/domains/assets/
├── entities/asset.py
├── value_objects/asset_id.py, asset_type.py, asset_status.py
├── enums/
├── rules/asset_rules.py
├── events/asset_created.py, asset_value_updated.py
├── api/
│   ├── controller.py (thin: request -> DTO -> service -> response)
│   ├── dependencies.py
│   ├── router.py
│   ├── requests.py
│   └── responses.py
├── repositories/
│   ├── contracts.py (re-exports ports/persistence/asset_repository.py)
│   └── asset_repository.py (re-export shim)
├── queries/
│   ├── asset_query_service.py (re-export shim of adapter)
│   └── query_ids.py (re-export shim)
├── dtos/
│   ├── create_asset_dto.py
│   ├── update_asset_dto.py
│   └── asset_filter_dto.py
└── services/asset_service.py (constructor takes ONLY ports)
```

**Ports (canonical location):**
```
app/ports/
├── persistence/asset_repository.py
├── events/event_publisher.py
└── ...
```

**Adapters (canonical location):**
```
app/adapters/
└── persistence/asset_sql_adapter.py
   (contains AssetQueryIds + implements AssetRepository port via SQLQueryManager)
```

### Architecture Flow (Reference)

```text
AssetController → AssetService → AssetRepository(PORT)
                                → AssetSqlAdapter(ADAPTER)
                                → SQLQueryManager(MANAGER)
                                → QueryRegistry → QueryDefinition
                                → QueryExecutor → DatabaseManager → Database
```

Query IDs (`ASSET.CREATE`, `ASSET.GET_BY_ID`, `ASSET.LIST`, `ASSET.UPDATE`, `ASSET.REVALUE`, `ASSET.ARCHIVE`) exist ONLY in `adapters/persistence/asset_sql_adapter.py`.

### Architecture Guard Tests

Location: `tests/architecture/test_dependency_rules.py`

Rules enforced:
1. `domains/**` + `ports/**` never import `platform/`, `registries/`, `infrastructure/`, `integrations/`, `queries/`, `definitions/`
2. `platform/**` never imports `domains/**`
3. Adapters never import `domains/**`
4. No `services/*` file references infrastructure symbols (`SQLQueryManager`, `QueryRegistry`, `QueryIds`, `IntegrationManager`, etc.)
5. Query IDs never appear in `domains/`

---

## 4. Phase 1 — Public / Authentication / Onboarding

**Domains:** `public_content`, `identity`, `customer`, `onboarding`

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.PUBLIC.LANDING.V1` | Landing page content |
| `CUS.AUTH.LOGIN.V1` | Login validation |
| `CUS.AUTH.SOCIAL.V1` | Social login validation |
| `CUS.PROFILE.GET.V1` | Get customer profile |
| `CUS.ONBOARDING.STEPS.V1` | Get onboarding steps |

### Events
| ID | Description |
|----|-------------|
| `EVT.CUSTOMER.REGISTERED.V1` | Customer registered |
| `EVT.CUSTOMER.VERIFIED.V1` | Customer verified |
| `EVT.CUSTOMER.ONBOARDING_COMPLETED.V1` | Onboarding completed |

### Integration IDs
| ID | Provider |
|----|----------|
| `INT.SMS.TRANSACTIONAL.V1` | SMS provider |
| `INT.EMAIL.TRANSACTIONAL.V1` | Email provider |
| `INT.IDENTITY.OTP.V1` | OTP service |
| `INT.IDENTITY.SOCIAL.V1` | Social identity (Google/Apple/Facebook) |
| `INT.PUSH.CUSTOMER.V1` | Push notification |

### Screens
| ID | Description |
|----|-------------|
| `CUS.PUBLIC.LANDING.001` | Landing page |
| `CUS.AUTH.LOGIN.001` | Login screen |
| `CUS.AUTH.REGISTER.001` | Registration |
| `CUS.ONBOARDING.START.001` | Onboarding start |
| `CUS.PROFILE.001` | Customer profile |

### Ports
| Port | Methods |
|------|---------|
| `AuthPort` | `login()`, `social_login()`, `verify_otp()` |
| `CustomerRepositoryPort` | `create()`, `get_by_id()`, `get_by_email()` |
| `OnboardingPort` | `get_steps()`, `complete_step()` |
| `OTPPort` | `send_otp()`, `verify_otp()` |
| `EventPublisherPort` | `publish()` |

### Flow
```
LoginScreen → POST /api/v1/auth/login → AuthController → AuthDTO
  → AuthUseCase → AuthPort → AuthAdapter → IntegrationManager
  → INT.IDENTITY.OTP.V1 → External Provider → EVT.CUSTOMER.REGISTERED.V1
    → NotificationAdapter → INT.SMS.TRANSACTIONAL.V1
```

---

## 5. Phase 2 — Home / Location / Properties

**Domains:** `home`, `location`, `property`

### Home — Aggregator Read Ports
```text
HomeService
  ├── ActiveBookingReadPort
  ├── CatalogReadPort
  ├── MaintenanceReadPort
  ├── WalletReadPort
  ├── RecommendationReadPort
  └── NotificationReadPort
```

**Read-only — never joins random domain tables.** All reads resolved through registered query adapters.

| Domain | Query IDs | Screens |
|--------|-----------|---------|
| `home` | `CUS.HOME.DASHBOARD.V1` | `CUS.HOME.001` |
| `location` | `CUS.LOCATION.LIST.V1`, `CUS.LOCATION.GEOCODE.V1` | `CUS.LOCATION.LIST.001` |
| `property` | `CUS.PROPERTY.LIST.V1`, `CUS.PROPERTY.GET.V1` | `CUS.PROPERTY.LIST.001` |

### Ports
| Port | Methods |
|------|---------|
| `ActiveBookingReadPort` | `get_active_booking()` |
| `CatalogReadPort` | `get_featured_services()` |
| `MaintenanceReadPort` | `get_upcoming_maintenance()` |
| `WalletReadPort` | `get_balance()` |
| `RecommendationReadPort` | `get_recommendations()` |
| `NotificationReadPort` | `get_unread_notifications()` |

### Integration IDs
| ID | Provider |
|----|----------|
| `INT.MAPS.GEOCODE.V1` | Geocoding |
| `INT.MAPS.ROUTING.V1` | Routing |

---

## 6. Phase 3 — Catalog / Search / Service Details

**Domains:** `catalog`, `search`, `provider`

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.CATALOG.CATEGORIES.V1` | Category list |
| `CUS.CATALOG.SERVICE.GET.V1` | Service details |
| `CUS.SEARCH.SERVICES.V1` | Search results |
| `CUS.SEARCH.SUGGESTIONS.V1` | Search autocomplete |

### Screens
| ID | Description |
|----|-------------|
| `CUS.SERVICE.CATALOG.001` | Service catalog |
| `CUS.SERVICE.SEARCH.001` | Search screen |
| `CUS.SERVICE.DETAIL.001` | Service detail |
| `CUS.PROVIDER.LIST.001` | Provider list |
| `CUS.PROVIDER.PROFILE.001` | Provider profile |

### Ports
| Port | Methods |
|------|---------|
| `CatalogReadPort` | `get_categories()`, `get_service()` |
| `SearchPort` | `search_services()`, `get_suggestions()` |
| `ServiceAreaPort` | `is_in_service_area()` |
| `RecommendationPort` | `recommend_services()` |

---

## 7. Phase 4 — Service Request / Validation

**Domain:** `service_request`

### Workflow: `WF.SERVICE_REQUEST.V1`
```text
DRAFT → SUBMITTED → VALIDATING → VALID
  ↳ NEEDS_INFORMATION
  ↳ OUTSIDE_SERVICE_AREA
  ↳ NO_PROVIDER_AVAILABLE
  ↳ CANCELLED
```

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.REQUEST.GET.V1` | Get request by ID |
| `CUS.REQUEST.LIST.V1` | List customer requests |

### Events
| ID | Description |
|----|-------------|
| `EVT.REQUEST.CREATED.V1` | Request created |
| `EVT.REQUEST.VALIDATED.V1` | Request validated |

### Screens
| ID | Description |
|----|-------------|
| `CUS.REQUEST.CREATE.001` | Create request |

### Ports
| Port | Methods |
|------|---------|
| `ServiceRequestRepositoryPort` | `create()`, `get()`, `list()`, `update_status()` |
| `EligibilityPort` | `check_eligibility()` |
| `PropertyPort` | `get_property()` |
| `FilePort` | `upload_evidence()` |
| `ServiceAreaPort` | `validate_area()` |

### Flow
```text
CUS.REQUEST.CREATE.001 → POST /api/v1/customer/service-requests
  → ServiceRequestController → CreateServiceRequestDTO
  → ServiceRequestUseCase → ServiceRequestDomainService
      ├── EligibilityPort
      ├── PropertyPort
      └── ServiceCatalogPort
  → ServiceRequestRepositoryPort
  → SQLServiceRequestAdapter → SQLQueryManager → QRY.CUS.REQUEST.CREATE.V1
  → Database → EVT.REQUEST.CREATED.V1 → Listeners (Matching, Notification, Analytics)```

---

## 8. Phase 5 — Matching / Providers / Quotations

**Domains:** `matching`, `provider`, `quotation`

### Matching Strategies Registry
| ID | Strategy |
|----|----------|
| `MATCH.DEFAULT.V1` | Proximity + rating |
| `MATCH.EMERGENCY.V1` | Nearest available, priority surge |
| `MATCH.REPEAT_PROVIDER.V1` | Previously used provider |

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.QUOTE.LIST.V1` | List quotes for a request |

### Events
| ID | Description |
|----|-------------|
| `EVT.QUOTE.CREATED.V1` | Quote created by provider |
| `EVT.QUOTE.ACCEPTED.V1` | Customer accepts quote |

### Screens
| ID | Description |
|----|-------------|
| `CUS.QUOTE.LIST.001` | Quotes list |
| `CUS.PROVIDER.LIST.001` | Provider selection |

### Ports
| Port | Methods |
|------|---------|
| `ProviderReadPort` | `find_providers()`, `get_provider_profile()` |
| `QuotationReadPort` | `list_quotes()`, `get_quote()` |
| `RankingPort` | `rank_providers()` |

---

## 9. Phase 6 — Booking / Initial Payment

**Domains:** `booking`, `payment`

### Workflow: `WF.BOOKING.CUSTOMER.V1`

States:
```text
REQUESTED -> VALIDATING -> MATCHING -> PROVIDER_SELECTED -> QUOTE_ACCEPTED
  -> CONFIRMED -> PAYMENT_AUTHORIZED -> ON_THE_WAY -> ARRIVED -> SERVICE_READY
  -> STARTED -> IN_PROGRESS -> COMPLETION_REQUESTED -> CUSTOMER_CONFIRMED
  -> FINAL_PAYMENT_PENDING -> PAID -> CLOSED
```

Alternative branches:
```text
CANCELLED | DISPUTED | CORRECTION_REQUIRED | PAYMENT_FAILED
```

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.BOOKING.GET.V1` | Get booking by ID |
| `CUS.BOOKING.LIST.V1` | List customer bookings |
| `CUS.BOOKING.ACTIVE.V1` | Active booking (for home aggregator) |

### Events
| ID | Description |
|----|-------------|
| `EVT.BOOKING.CONFIRMED.V1` | Booking confirmed |
| `EVT.PAYMENT.AUTHORIZED.V1` | Payment authorized |

### Screens
| ID | Description |
|----|-------------|
| `CUS.BOOKING.DETAIL.001` | Booking detail |
| `CUS.PAYMENT.CHECKOUT.001` | Payment checkout |

### Ports
| Port | Methods |
|------|---------|
| `BookingRepositoryPort` | `create()`, `get()`, `list()`, `update_status()` |
| `PaymentGatewayPort` | `authorize()`, `capture()`, `refund()` |
| `QuoteReadPort` | `get_accepted_quote()` |


---

## 10. Phase 7 — Booking Details / Messaging / Tracking

**Domains:** `conversation`, `tracking`, extend `booking`

### New Platform
- `WebSocketManager` — real-time communication
- `RealTimeGateway` — abstraction over WebSocket
- `LocationStream` — provider GPS streaming

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.BOOKING.TRACK.V1` | Live tracking info |

### Events
| ID | Description |
|----|-------------|
| `EVT.PROVIDER.ON_THE_WAY.V1` | Provider en route |
| `EVT.PROVIDER.ARRIVED.V1` | Provider arrived |

### Screens
| ID | Description |
|----|-------------|
| `CUS.BOOKING.TRACK.001` | Live tracking screen |
| `CUS.MESSAGING.CHAT.001` | Chat screen |

### Ports
| Port | Methods |
|------|---------|
| `ConversationPort` | `get_messages()`, `send_message()` |
| `WebSocketPort` | `emit()`, `subscribe()` |
| `LocationStreamPort` | `subscribe_location()`, `publish_location()` |


---

## 11. Phase 8 — Service Execution / Change / Completion

**Domains:** `service_execution`, `change_request`, `completion`

### Workflows
| ID | States |
|----|--------|
| `WF.SERVICE.EXECUTION.V1` | STARTED -> IN_PROGRESS -> COMPLETION_REQUESTED -> CUSTOMER_CONFIRMED |
| `WF.CHANGE_REQUEST.V1` | REQUESTED -> APPROVED/REJECTED |
| `WF.COMPLETION.V1` | CUSTOMER_CONFIRMED -> FINAL_PRICING_CALCULATED -> PAYMENT_CAPTURED -> CLOSED |

### Events
| ID | Description |
|----|-------------|
| `EVT.SERVICE.STARTED.V1` | Service started |
| `EVT.CHANGE.APPROVED.V1` | Change request approved |
| `EVT.SERVICE.COMPLETED.V1` | Service completed |

### Ports
| Port | Methods |
|------|---------|
| `ServiceExecutionPort` | `start()`, `complete()` |
| `ChangeRequestPort` | `request_change()`, `approve()` |
| `CompletionPort` | `request_completion()`, `finalize()` |


---

## 12. Phase 9 — Final Payment / Invoice

**Domains:** `invoice` (new), extend `payment`, `wallet`

### Business Chain
```text
CompletionConfirmed -> FinalPricingCalculated -> PaymentCaptured
  -> InvoiceFinalized -> BookingClosed
```

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.INVOICE.GET.V1` | Get invoice by booking ID |
| `CUS.INVOICE.LIST.V1` | List customer invoices |

### Events
| ID | Description |
|----|-------------|
| `EVT.PAYMENT.COMPLETED.V1` | Payment completed |
| `EVT.INVOICE.FINALIZED.V1` | Invoice finalized |
| `EVT.BOOKING.CLOSED.V1` | Booking closed |

### Ports
| Port | Methods |
|------|---------|
| `InvoicePort` | `create()`, `get()`, `list()` |
| `TaxPort` | `calculate_tax()` |
| `LedgerPort` | `credit()`, `debit()`, `hold()`, `release()` |

### Internal Integration Flow
```text
BookingService -> WalletReservationPort
  -> InternalWalletAdapter -> InternalIntegrationManager
  -> INT.INTERNAL.WALLET.RESERVE.V1 -> CommandManager
  -> CMD.WALLET.RESERVE.V1 -> WalletApplicationService -> WalletDomain
```


---

## 13. Phase 10 — Review / Warranty / Rebooking

**Domains:** new: `review`, `warranty`

### Events
| ID | Description |
|----|-------------|
| `EVT.REVIEW.CREATED.V1` | Customer review |
| `EVT.WARRANTY.CREATED.V1` | Warranty registered |
| `EVT.BOOKING.REBOOKED.V1` | Booking rebooked |
| `EVT.PROVIDER.FAVORITED.V1` | Provider favorited |

### Screens
| ID | Description |
|----|-------------|
| `CUS.REVIEW.CREATE.001` | Create review |

### Ports
| Port | Methods |
|------|---------|
| `ReviewPort` | `create()`, `get()` |
| `WarrantyPort` | `create()`, `get()`, `check_validity()` |


---

## 14. Phase 11 — Recurring / Assets / Maintenance

**Domains:** new: `recurring_service`, `maintenance`

### New Platform
- `RecurringBookingManager`
- `SchedulerManager`

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.RECURRING.LIST.V1` | List recurring services |
| `CUS.MAINTENANCE.LIST.V1` | List scheduled maintenance |

### Jobs / Scheduler
| ID | Description |
|----|-------------|
| `JOB.RECURRING.BOOKING.V1` | Create recurring bookings |
| `JOB.MAINTENANCE.REMINDER.V1` | Maintenance reminder |

### Ports
| Port | Methods |
|------|---------|
| `RecurringBookingPort` | `schedule()`, `cancel()` |
| `AssetPort` | `list_assets()`, `get_asset()` |
| `MaintenancePort` | `schedule()`, `complete()` |


---

## 15. Phase 12 — Wallet / Promotions / Loyalty

**Domains:** new: `wallet`, `promotion`, `loyalty`, `referral`

### Wallet Ledger Structure
```text
Wallet -> WalletLedger (Credit | Debit | Hold | Release | Refund)
```

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.WALLET.GET_BALANCE.V1` | Get wallet balance |
| `CUS.WALLET.LIST_TRANSACTIONS.V1` | List wallet transactions |
| `CUS.WALLET.CREDIT.V1` | Credit wallet |
| `CUS.WALLET.DEBIT.V1` | Debit wallet |

### Screens
| ID | Description |
|----|-------------|
| `CUS.WALLET.001` | Wallet screen |
| `CUS.PROMOTION.LIST.001` | Promotions list |
| `CUS.LOYALTY.001` | Loyalty dashboard |

### Ports
| Port | Methods |
|------|---------|
| `LedgerPort` | `credit()`, `debit()`, `hold()`, `release()` |
| `WalletReadPort` | `get_balance()`, `list_transactions()` |
| `PromotionEnginePort` | `apply_promotion()`, `validate()` |
| `LoyaltyPort` | `earn()`, `redeem()`, `get_points()` |


---

## 16. Phase 13 — Cancellation / Support / Disputes

**Domains:** new: `cancellation`, `support`, `dispute`

### Workflow
| ID | States |
|----|--------|
| `WF.DISPUTE.V1` | OPEN -> IN_REVIEW -> RESOLVED (branches: APPROVED, REJECTED) |

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.SUPPORT.TICKET.GET.V1` | Get support ticket |
| `CUS.DISPUTE.GET.V1` | Get dispute |

### Audit IDs
| ID | Description |
|----|-------------|
| `AUD.CUSTOMER.ADDRESS.CREATED` | Customer address created |
| `AUD.QUOTE.ACCEPTED` | Quote accepted |
| `AUD.BOOKING.CANCELLED` | Booking cancelled |
| `AUD.CHANGE.APPROVED` | Change request approved |
| `AUD.COMPLETION.CONFIRMED` | Completion confirmed |
| `AUD.REFUND.REQUESTED` | Refund requested |
| `AUD.SECURITY.PASSWORD_CHANGED` | Password changed |

### Ports
| Port | Methods |
|------|---------|
| `CancellationPolicyPort` | `can_cancel()`, `calculate_penalty()` |
| `RefundPolicyPort` | `can_refund()`, `calculate_refund()` |
| `SupportPort` | `create_ticket()`, `get_ticket()` |
| `DisputePort` | `raise_dispute()`, `resolve()` |


---

## 17. Phase 14 — History / Notifications / Activity

**Domains:** read-model heavy — new: `history`, `activity`

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.HISTORY.BOOKINGS.V1` | Booking history |
| `CUS.HISTORY.BOOKING_TIMELINE.V1` | Booking timeline |
| `CUS.NOTIFICATION.CENTER.V1` | Notification center |
| `CUS.ACTIVITY.LIST.V1` | Activity feed |

### Screens
| ID | Description |
|----|-------------|
| `CUS.HISTORY.001` | History screen |
| `CUS.NOTIFICATION.CENTER.001` | Notification center |

### Notification Lifecycle
```text
Create -> Deduplicate -> Persist -> Preference Check
  -> Channel Selection -> Dispatch -> Delivery Tracking
  -> Retry -> Read/Acknowledge -> Expire
```

### Ports
| Port | Methods |
|------|---------|
| `HistoryReadPort` | `get_bookings()`, `get_timeline()` |
| `ActivityReadPort` | `get_activity()` |


---

## 18. Phase 15 — Account / Security / Privacy

**Domains:** new: `account`, `security`, `privacy`, `preference`, `consent`, `session`, `device`

### New Platform Managers
- `PrivacyManager`
- `ConsentManager`
- `SessionManager`
- `DeviceManager`
- `DataExportJob`
- `AccountClosureWorkflow`
- `RetentionPolicy`

### Query IDs
| ID | Description |
|----|-------------|
| `CUS.SETTINGS.PROFILE.GET.V1` | Get profile |
| `CUS.SETTINGS.PAYMENT_METHODS.V1` | List payment methods |
| `CUS.SETTINGS.DEVICES.V1` | List devices |

### Screens
| ID | Description |
|----|-------------|
| `CUS.SETTINGS.PROFILE.001` | Profile settings |
| `CUS.SETTINGS.SECURITY.001` | Security settings |
| `CUS.SETTINGS.PRIVACY.001` | Privacy settings |
| `CUS.SETTINGS.NOTIFICATIONS.001` | Notification preferences |

### Events
| ID | Description |
|----|-------------|
| `EVT.ACCOUNT.CLOSURE_REQUESTED.V1` | Account closure requested |
| `EVT.DATA.EXPORT_COMPLETED.V1` | Data export completed |

### Ports
| Port | Methods |
|------|---------|
| `ProfilePort` | `update()`, `get()` |
| `PaymentMethodPort` | `add()`, `remove()`, `list()` |
| `DevicePort` | `list_devices()`, `revoke()` |
| `ConsentPort` | `grant()`, `revoke()`, `get()` |


---

## 19. Version, Status & ID Policy

### ID Format
| Type | Format | Example |
|------|--------|---------|
| Query | `QRY.<SCOPE>.<DOMAIN>.<OPERATION>.V<ver>` | `QRY.CUS.BOOKING.GET.V1` |
| Integration (external) | `INT.<CATEGORY>.<PROVIDER>.V<ver>` | `INT.PAYMENT.MOBILE_MONEY.V1` |
| Integration (internal) | `INT.INTERNAL.<DOMAIN>.<OPERATION>.V<ver>` | `INT.INTERNAL.WALLET.RESERVE.V1` |
| Event | `EVT.<SCOPE>.<DOMAIN>.<EVENT>.V<ver>` | `EVT.BOOKING.CONFIRMED.V1` |
| Command | `CMD.<DOMAIN>.<OPERATION>.V<ver>` | `CMD.WALLET.RESERVE.V1` |
| Workflow | `WF.<DOMAIN>.<FLOW>.V<ver>` | `WF.BOOKING.CUSTOMER.V1` |
| Notification | `NTF.<DOMAIN>.<TRIGGER>.V<ver>` | `NTF.BOOKING.CONFIRMED.V1` |
| Audit | `AUD.<DOMAIN>.<ACTION>` | `AUD.BOOKING.CANCELLED` |
| Job | `JOB.<DOMAIN>.<OPERATION>.V<ver>` | `JOB.RECURRING.BOOKING.V1` |
| Screen | `CUS.<MODULE>.<SCREEN>.<num>` | `CUS.BOOKING.DETAIL.001` |
| Feature | `FEATURE.<NAME>` | `FEATURE.REALTIME_TRACKING` |

### Registry Status Values
| Status | Meaning |
|--------|---------|
| `ACTIVE` | Ready for production use |
| `DEPRECATED` | Still functional, will be removed; migrate consumers |
| `DISABLED` | Registered but blocked from execution |
| `EXPERIMENTAL` | Available only in non-production contexts |


---

## 20. Complete Runtime Example — Service Request Creation

```text
Screen ID: CUS.REQUEST.CREATE.001

Frontend (sends X-Screen-ID)
  -> POST /api/v1/customer/service-requests
  -> RequestContextMiddleware (request_id, correlation_id, screen_id, customer_id)
  -> ServiceRequestController
  -> CreateServiceRequestRequest (validation)
  -> CreateServiceRequestDTO
  -> CreateServiceRequestHandler -> ServiceRequestDomainService
      |-- EligibilityPort
      |-- PropertyPort
      |-- ServiceCatalogPort
  -> ServiceRequestRepositoryPort
  -> SQLServiceRequestRepository (ADAPTER — QRY.CUS.REQUEST.CREATE.V1 lives here)
  -> SQLQueryManager (validate -> registry -> load -> execute -> metrics -> audit)
  -> QueryRegistry -> QueryDefinition -> QueryExecutor -> DatabaseManager
  -> Database

  -> ServiceRequestCreated (Domain Event)
  -> EventPublisherPort -> EventManager -> EVT.REQUEST.CREATED.V1
      |-- LST.MATCHING.RUN
      |-- LST.NOTIFICATION.CREATE (sends NTF.REQUEST.RECEIVED.V1)
      |-- LST.ANALYTICS.RECORD
      |-- LST.AUDIT.RECORD

  -> Response -> Frontend

All sharing: CORRELATION_ID = COR-63AB72
```

### Traceability
```text
CUS.REQUEST.CREATE.001     (screen)
  -> API.CUS.SERVICE_REQUEST.CREATE.V1
  -> USECASE.CUS.REQUEST.CREATE.V1
  -> PORT.SERVICE_REQUEST.REPOSITORY
  -> QRY.CUS.REQUEST.CREATE.V1
  -> DB.PRIMARY
  -> EVT.REQUEST.CREATED.V1
```

---

## 21. Complete Runtime Example — Payment

```text
Screen ID: CUS.PAYMENT.CHECKOUT.001

PaymentController
  -> AuthorizePaymentUseCase
  -> PaymentDomainService
  -> PaymentGatewayPort (PORT)
  -> RegisteredPaymentAdapter (ADAPTER — INT.PAYMENT.MOBILE_MONEY.V1 lives here)
  -> ExternalIntegrationManager -> IntegrationRegistry
  -> INT.PAYMENT.MOBILE_MONEY.V1 -> ProviderResolver
  -> M-Pesa Adapter -> Mobile Money Provider
  -> Payment Result
  -> PaymentRepositoryPort -> SQLPaymentRepository (ADAPTER)
  -> SQLQueryManager -> QRY.PAYMENT.AUTHORIZATION.STORE.V1
  -> Database
  -> PaymentAuthorized Event -> EVT.PAYMENT.AUTHORIZED.V1

Booking never learns which mobile-money provider processed the payment.
```

---

## 22. Complete Internal-Domain Example — Booking needs Wallet

```text
BookingApplicationService
  -> WalletReservationPort (PORT)
  -> InternalWalletAdapter (ADAPTER)
  -> InternalIntegrationManager
  -> INT.INTERNAL.WALLET.RESERVE.V1
  -> CommandManager -> CMD.WALLET.RESERVE.V1
  -> WalletApplicationService -> WalletDomain

This preserves domain ownership. Booking never directly CRUDs wallet tables.
```


---

## 23. Domain Ownership Rule

Every database table belongs to exactly one domain.

**Booking owns:** `BOOKINGS`, `BOOKING_TIMELINE`, `BOOKING_ITEMS`
**Payment owns:** `PAYMENTS`, `PAYMENT_ATTEMPTS`, `PAYMENT_AUTHORIZATIONS`, `REFUNDS`
**Wallet owns:** `WALLETS`, `WALLET_LEDGER`, `WALLET_HOLDS`

Architecture tests enforce: no domain may directly reference another domain's tables.

---

## 24. CQRS-lite Policy

We use a lightweight CQRS split:

- **Command Side:** Create, Update, Delete, State transitions (write model)
- **Query Side:** Lists, Dashboards, Search, Reports, History, Aggregations (read model)

```text
Application
├── commands/  (write operations)
└── queries/   (read operations — behind QueryRegistry)
```

The Query Registry remains behind query adapters.

---

## 25. Final Implementation Order

```text
PHASE 0  Architecture Foundation
PHASE 1  Public + Authentication + Onboarding
PHASE 2  Home + Location + Properties
PHASE 3  Catalog + Search + Service Details
PHASE 4  Service Request + Validation
PHASE 5  Matching + Providers + Quotations
PHASE 6  Booking + Initial Payment
PHASE 7  Booking Details + Messaging + Tracking
PHASE 8  Service Execution + Change + Completion
PHASE 9  Final Payment + Invoice
PHASE 10 Review + Warranty + Rebooking
PHASE 11 Recurring Services + Assets + Maintenance
PHASE 12 Wallet + Promotions + Loyalty
PHASE 13 Cancellation + Support + Disputes
PHASE 14 History + Notifications + Activity
PHASE 15 Account + Security + Privacy
```

---

## 26. Non-Negotiable Rules

1.  No SQL inside controllers, application services, or domain services.
2.  Services never touch HTTP objects; controllers never touch SQL/providers.
3.  Side effects belong to LISTENERS, never inline in services.
4.  External systems ONLY through IntegrationManager.execute(INT-ID,...).
5.  Every mutating action emits a domain event; audit != logging.
6.  Correlation ID must appear end-to-end in every log line.
7.  No application service may directly access QueryRegistry.
8.  No application service should normally access SQLQueryManager.
9.  All SQL CRUD operations must have registered IDs.
10. Only persistence/query adapters may request registered SQL operations.
11. SQLQueryManager is the only normal execution gateway to registered SQL.
12. No domain may directly CRUD another domain's tables.
13. Cross-domain behavior uses ports + internal integrations + commands/events.
14. No external provider SDK may appear inside application/domain services.
15. External providers go through IntegrationManager + IntegrationRegistry.
16. Internal and external integrations remain separately registered.
17. Every important business event receives a stable registered ID.
18. Event producers do not know their listeners.
19. All important workflows use registered state machines.
20. Status transitions cannot be manually changed outside WorkflowManager.
21. All persistent notifications use NotificationManager.
22. Notification channels never live in booking/payment/etc.
23. Pricing comes from the PricingManager/Engine.
24. Promotions come from the Promotion Engine.
25. Permissions and ownership are centrally validated and reinforced at query level.
26. Every customer screen receives a Screen ID.
27. Every request receives request, correlation, and trace IDs.
28. Audit and diagnostic logging remain separate.
29. Files use FileManager, not direct filesystem/S3 calls.
30. Jobs use JobManager/queue infrastructure.
31. Scheduled work uses SchedulerManager.
32. Feature availability uses FeatureManager/Registry.
33. Secrets are never stored in registry definitions; entries reference secret keys only.
34. Architecture tests enforce these dependency rules automatically.

---

## 27. Architecture Guard Tests

Location: `tests/architecture/test_dependency_rules.py`

| Rule # | Constraint | Enforcement |
|--------|------------|-------------|
| 1 | `domains/**` + `ports/**` never import `platform/`, `registries/`, `infrastructure/`, `integrations/`, `queries/`, `definitions/` | AST import scan |
| 2 | `platform/**` never imports `domains/**` | AST import scan |
| 3 | Adapters never import `domains/**` | AST import scan |
| 4 | No `services/*` file references infrastructure symbols | String match |
| 5 | All governed query IDs registered in `registry.yaml` | Startup validation |
| 6 | All integration IDs registered | Startup validation |

### Layer Access Policy

| Layer | Manager | Registry | SQL / Provider |
|-------|---------|----------|----------------|
| Controller | no | no | no |
| Application Service | no* | no | no |
| Domain | no | no | no |
| Port | no | no | no |
| Adapter | yes | no | via managers only |
| Manager | — | yes | yes |
| Registry | no | — | definition only |
| Infrastructure | yes | controlled | yes |

*Only genuine business facades may be exposed.

---

## 28. Registry Validation Script

Location: `scripts/registry_validate.sh`

Validates at startup:
- All query definitions have corresponding SQL files
- No duplicate query IDs
- All integration IDs are unique
- All screen IDs follow the `CUS.*` pattern
- All event IDs follow the `EVT.*` pattern
- All workflow IDs follow the `WF.*` pattern
