# FIXO Provider Backend — Implementation Roadmap

> Implements the **Provider Business Requirements** (54 phases) as backend
> modules on top of the existing FIXO core (marketplace, bookings, matching,
> quotations, payments, wallets, messaging, disputes, reviews, notifications,
> recurring, support, cancellations — which the customer flow already laid down).
>
> The provider side is a **field-service management system** connected to the
> marketplace: registration & identity, onboarding, profile/business/verification,
> services/pricing/service-areas/availability, the job lifecycle (requests →
> quotes → bookings → dispatch → arrival → execution → completion → billing),
> finances (earnings/wallet/payouts/commission/statements), reputation, team &
> assignment, documents, promotions, analytics, settings, restrictions & closure.
>
> **Conventions (same golden rules as the core):**
> - No SQL outside `app/queries/**/`; IDs `PROV.*`; ownership enforced in SQL.
> - Services depend only on ports; adapters own query IDs; side-effects via events.
> - Provider auth is provider-scoped (`PROVIDER_AUTH_SESSIONS`, `PROVIDER_OTP_CODES`,
>   `get_current_provider`), mirroring the customer auth without touching it.
> - **Git flow (house structure):** one page branch per phase
>   `page/provider-<slug>` (forked from `module/provider`) → merged into
>   `module/provider` (`merge: page/provider-<slug> into module/provider`) →
>   `module/provider` merged into `dev` (`merge: module/provider into dev
>   (<short summary>)`). Tags `provider-phaseN-v1` sit on the phase's page
>   branch; module-level tags periodically on `module/provider`.
> - One implementation commit per phase; tags `provider-phaseN-v1`.

## Requirement phases → implementation phases

| Impl | Req phases | Scope | Status |
|------|-----------|-------|--------|
| PRV-0 | — | Roadmap + provider domain foundation (this doc) | ✅ |
| PRV-1 | 1 | **Provider Public Entry & Registration** — auth: register, OTP verify, login, refresh, me | ✅ |
| PRV-2 | 2 | **Provider Onboarding** — 7-step guided onboarding + auto-saved progress | ✅ |
| PRV-3 | 3 | **Provider Profile** — public profile fields + preview | ✅ |
| PRV-4 | 4 | **Business Profile** — company/logo/registration, business info | ✅ |
| PRV-5 | 5 | Identity & Provider Verification — documents + verification workflow | ✅ done (tag `provider-phase5-v1`) |
| PRV-6 | 6 | Service Category Setup — provider services + configuration | ✅ done |
| PRV-7 | 7 | Provider Pricing — fixed/starting/hourly/inspection/custom + per-service | ✅ done (tag `provider-phase7-v1`) |
| PRV-8 | 8 | Service Area Management — areas/radius/travel fee | ✅ done (tag `provider-phase8-v1`) |
| PRV-9 | 9 | Availability & Working Hours — schedule, online toggle | ✅ done (tag `provider-phase9-v1`) |
| PRV-10 | 10 | Provider Dashboard — attention items, stats, quick actions | ✅ done (tag `provider-phase10-v1`) |
| PRV-11 | 11 | Incoming Job Requests — feed + accept/decline/quote/ask | ✅ done (tag `provider-phase11-v1`) |
| PRV-12 | 12 | Matching Engine interaction — provider eligibility/ranking read | ✅ done (tag `provider-phase12-v1`) |
| PRV-13 | 13 | Quotations / Offers — provider quote submit + statuses | ✅ done (tag `provider-phase13-v1`) |
| PRV-14 | 14 | Booking Confirmation — provider acknowledgement + handoff | ✅ done (tag `provider-phase14-v1`) |
| PRV-15 | 15 | Provider Calendar — schedule views + overlap prevention | ✅ done (tag `provider-phase15-v1`) |
| PRV-16 | 16 | Booking Details lifecycle — confirm→…→paid + ops screen | ✅ done (tag `provider-phase16-v1`) |
| PRV-17 | 17 | Customer Communication — booking-linked messaging | ✅ done (tag `provider-phase17-v1`) |
| PRV-18 | 18 | Navigation & Provider Tracking — trip + ETA | ✅ done (tag `provider-phase18-v1`) |
| PRV-19 | 19 | Arrival Verification — arrived + PIN/QR/OTP | ✅ done (tag `provider-phase19-v1`) |
| PRV-20 | 20 | Start Service — start job + timer | ✅ done (tag `provider-phase20-v1`) |
| PRV-21 | 21 | Job Checklist — templated task lists | ✅ done (tag `provider-phase21-v1`) |
| PRV-22 | 22 | Evidence & Job Documentation — photos/videos/notes/measurements/instructions/parts on the booking | ✅ done (tag `provider-phase22-v1`) |
| PRV-23 | 23 | Change Request — scope change + approval (provider submissions: reason/new work/labour/materials/time/price/photos; withdraw) | ✅ done (tag `provider-phase23-v1`) |
| PRV-24 | 24 | Materials & Expenses — booking material lines (item/qty/amount) + receipt/photo/invoice attachments, per-currency totals | ✅ done (tag `provider-phase24-v1`) |
| PRV-25 | 25 | Job Completion — completion notes + evidence | ✅ done (commit `d0872e0`) |
| PRV-26 | 26 | Customer Sign-Off | ✅ done (commit `d0872e0`) |
| PRV-27 | 27 | Final Billing | ✅ done (tag `provider-phase27-v1`) |
| PRV-28 | 28 | Provider Earnings | ✅ done (tag `provider-phase28-v1`) |
| PRV-29 | 29 | Provider Wallet | ✅ done (tag `provider-phase29-v1`) |
| PRV-30 | 30 | Payout Management — methods + withdrawals | ✅ done (tag `provider-phase30-v1`) |
| PRV-31 | 31 | Commission & Fees — gross/commission/tax/net | ⏳ |
| PRV-32 | 32 | Invoices & Statements | ✅ |
| PRV-33 | 33 | Ratings & Reviews | ✅ |
| PRV-34 | 34 | Provider Performance KPIs | ✅ |
| PRV-35 | 35 | Provider Ranking & Reputation | ✅ |
| PRV-36 | 36 | Portfolio | ✅ |
| PRV-37 | 37 | Provider Notifications | ✅ |
| PRV-38 | 38 | Cancellations & Rescheduling | ⏳ |
| PRV-39 | 39 | Disputes | ✅ |
| PRV-40 | 40 | Provider Support | ✅ |
| PRV-41 | 41 | Safety & Incident Reporting | ✅ |
| PRV-42 | 42 | Recurring Customers | ✅ |
| PRV-43 | 43 | Business Customers + negotiated rates | ✅ |
| PRV-44 | 44 | Team Management — workers/roles | ✅ |
| PRV-45 | 45 | Job Assignment — dispatch/technician | ✅ |
| PRV-46 | 46 | Equipment & Tools registry | ✅ |
| PRV-47 | 47 | Documents & Compliance + expiry | ✅ |
| PRV-48 | 48 | Promotions | ✅ |
| PRV-49 | 49 | Provider Analytics | ✅ |
| PRV-50 | 50 | Provider Settings (personal/business/notifications/security/privacy) | ✅ |
| PRV-51 | 51 | Provider Activity & Audit History | ✅ |
| PRV-52 | 52 | Subscription / Provider Plans | ✅ |
| PRV-53 | 53 | Account Restrictions & Status | ✅ |
| PRV-54 | 54 | Account Closure | ✅ |

Verification: `cd applications/backend && python -m pytest` stays green (new unit
tests included per phase); each phase ships migration + queries + port/adapter +
service + router + wiring + tests + its own commit/tag.

## Phase 31 — Commission & Fees

Phase 31 adds provider commission/fee visibility and application:

- `PROVIDER_COMMISSION_RATES` — provider-scoped commission + tax rate
  configuration per currency, with active/effective-date scoping.
- `PROVIDER_COMMISSION_FEES` — audit-immutable commission/fee application
  records: gross, commission, tax, net, currency, status, references,
  timestamps.
- Governed queries `PROV.COMMISSION.RATE`, `PROV.COMMISSION.FEES.APPLY`,
  `PROV.COMMISSION.FEES.LIST`, `PROV.COMMISSION.FEES.SUMMARY`.
- `ProviderCommissionService` with:
  - current rate lookup,
  - commission/fee application (`gross -> commission -> tax -> net`),
  - provider fee history and totals.
- Router prefix `/providers/me/commission`:
  - `GET /rate`
  - `POST /apply`
  - `GET /fees`
  - `GET /fees/summary`

Commission is applied to the gross amount, tax is applied to the commission,
and net is gross minus commission minus tax, all in the same currency per
request. No background tasks are used in this phase — fee application is
synchronous through the service layer.

## Phase 32 — Invoices & Statements

Phase 32 adds provider-facing invoice management.

- `PROVIDER_INVOICES` — provider-owned invoice rows with invoice_number,
  period_start/end, gross/commission/tax/net amounts, currency, status
  (issued/paid/overdue), issued_at, due_at, paid_at, timestamps.
- Governed queries `PROV.INVOICES.LIST`, `PROV.INVOICES.GET`,
  `PROV.INVOICES.SUMMARY`.
- `ProviderInvoicesService` with:
  - list (paginated, newest period first),
  - single invoice fetch with ownership check,
  - totals + overdue count summary.
- Router prefix `/providers/me/invoices`:
  - `GET /` — list invoices
  - `GET /summary` — totals + overdue count
  - `GET /{invoice_id}` — single invoice

No generation or delivery in this phase — listing and reading only.

## Phase 33 — Ratings & Reviews

Phase 33 adds provider-facing review visibility.

- `PROVIDER_REVIEWS` — provider-owned review rows with booking_id, customer_id,
  rating (1-5), title, body, status (published), timestamps.
- Governed queries `PROV.REVIEWS.LIST`, `PROV.REVIEWS.DETAIL`, `PROV.REVIEWS.SUMMARY`.
- `ProviderReviewsService` with:
  - list (optional status and min_rating filters),
  - single review fetch with ownership check,
  - summary: total, average rating, star distribution, this-month count.
- Router prefix `/providers/me/ratings`:
  - `GET /` — list reviews
  - `GET /summary` — rating summary
  - `GET /{review_id}` — single review

Read-only in this phase — no review submission or response.

## Phase 34 — Provider Performance KPIs

Phase 34 adds provider-facing performance KPI visibility.

- `PROVIDER_KPIS` — provider-owned KPI rows by period (weekly/monthly/quarterly/yearly)
  with completion_rate, on_time_rate, avg_rating, response_time_minutes,
  jobs_completed, jobs_cancelled, revenue, timestamps.
- Governed queries `PROV.KPIS.LIST`, `PROV.KPIS.SUMMARY`.
- `ProviderKpisService` with:
  - list (optional period filter),
  - summary: averages and totals across all periods.
- Router prefix `/providers/me/kpis`:
  - `GET /` — list KPIs
  - `GET /summary` — KPI totals

Read-only in this phase — no KPI calculation or ingestion.

## Phase 35 — Provider Ranking & Reputation

Phase 35 adds provider-facing ranking visibility.

- `PROVIDER_RANKING` — provider-owned ranking row with rank_score,
  rank_level (bronze/silver/gold/platinum), badges (jsonb), completed_jobs,
  recurring_customers, referrals, avg_completion_rate, avg_on_time_rate,
  avg_rating, last_computed_at, timestamps.
- Governed queries `PROV.RANKING.GET`, `PROV.RANKING.LEADERBOARD`.
- `ProviderRankingService` with:
  - current provider ranking signals (ownership-checked),
  - public leaderboard of top providers by rank score.
- Router prefix `/providers/me/ranking`:
  - `GET /` — current provider ranking
  - `GET /leaderboard` — public top providers

Read-only in this phase — no rank computation or ingestion.

## Phase 36 — Portfolio

Phase 36 adds provider portfolio CRUD — completed job showcases with title,
description, service category, before/after image references, completion date,
featured flag, and status.

- `PROVIDER_PORTFOLIO` — provider-owned portfolio rows with title, description,
  service_category, before_image_url, after_image_url, completed_on,
  is_featured, status (published/draft/archived), timestamps.
- Governed queries `PROV.PORTFOLIO.LIST`, `PROV.PORTFOLIO.GET`,
  `PROV.PORTFOLIO.ADD`, `PROV.PORTFOLIO.UPDATE`, `PROV.PORTFOLIO.DELETE`.
- `ProviderPortfolioService` with:
  - list (optional status filter, featured first then newest),
  - single item fetch with ownership check,
  - add with validation (title required, max length, status enum),
  - update with validation (COALESCE behavior, partial updates),
  - delete with ownership check.
- Router prefix `/providers/me/portfolio`:
  - `GET /` — list portfolio items
  - `GET /{item_id}` — single item
  - `POST /` — add item
  - `PATCH /{item_id}` — update item
  - `DELETE /{item_id}` — remove item

Validation enforced server-side: title required (max 256), status must be
published/draft/archived. Featured items pinned to top of listings.

## Phase 37 — Provider Notifications

Phase 37 adds provider-facing notification management.

- `PROVIDER_NOTIFICATIONS` — provider-owned notification rows with channel
  (in_app/email/sms), category, title, body, is_read, reference_type,
  reference_id, timestamps.
- Governed queries `PROV.NOTIFICATIONS.LIST`, `PROV.NOTIFICATIONS.GET`,
  `PROV.NOTIFICATIONS.MARK_READ`, `PROV.NOTIFICATIONS.UNREAD_COUNT`.
- `ProviderNotificationsService` with:
  - list (optional status and category filters, unread first then newest),
  - single notification fetch with ownership check,
  - idempotent mark-read,
  - unread count.
- Router prefix `/providers/me/notifications`:
  - `GET /` — list notifications
  - `GET /{notification_id}` — single notification
  - `PATCH /{notification_id}/read` — mark as read
  - `GET /unread-count` — unread count

No delivery workers in this phase — notifications are managed synchronously
through the service layer.

## Phase 38 — DSL Cancellation & Rescheduling

Phase 38 adds a provider-facing DSL-based cancellation/rescheduling workflow.

- `PROVIDER_DSL_REQUESTS` — provider-owned DSL rows with dsl_kind
  (cancellation/reschedule), subject_type/subject_id, title, dsl (jsonb),
  status (open/escalated/closed/canceled), priority (low/medium/high/urgent),
  reason, requested_by, resolved_by/at, parent_id/root_request_id, timestamps.
- `PROVIDER_DSL_EXECUTION_LOGS` — ordered execution steps per DSL request
  (step_order, action, status, summary/error jsonb, started/finished).
- `PROVIDER_DSL_PROVIDER_METRICS` — provider lifetime rollups by period
  (total/resolved/canceled/escalated, avg_resolution_hours).
- Governed queries `PROV.DSL.REQUESTS.LIST`, `PROV.DSL.REQUESTS.GET`,
  `PROV.DSL.REQUESTS.CREATE`, `PROV.DSL.REQUESTS.UPDATE`,
  `PROV.DSL.REQUESTS.RESOLVE`, `PROV.DSL.EXECUTION_LOGS.INSERT`,
  `PROV.DSL.EXECUTION_LOGS.LIST`, `PROV.DSL.PROVIDER_METRICS.GET`.
- `ProviderDslRequestsService` with:
  - list (optional status and dsl_kind filters),
  - single request fetch with ownership check,
  - create with validation (kind/priority enums, title/subject/dsl required),
  - update with validation (partial updates, COALESCE behavior),
  - resolve (close) with ownership check,
  - execution-log reads with ownership check,
  - metrics read with zeroed default when no row exists.
- Router prefix `/providers/me/dsl-requests`:
  - `GET /` — list requests
  - `GET /metrics/summary` — lifetime metrics by period
  - `GET /{request_id}` — single request
  - `POST /` — create request
  - `PATCH /{request_id}` — update request
  - `POST /{request_id}/resolve` — close as resolved
  - `GET /{request_id}/logs` — execution steps

No background workers in this phase — requests are managed synchronously
through the service layer.

## Phase 39 — Provider Disputes

Phase 39 adds a provider side to the existing customer dispute surface.

- `DISPUTES.provider_id` (new column, backfilled from `BOOKINGS.provider_id`)
  plus an index, so provider-owned dispute views are direct.
- `PROVIDER_DISPUTE_RESPONSES` — provider-supplied responses to disputes
  (kind: acknowledgment/explanation/refund_offer, body, timestamps).
- Governed queries `PROV.DISPUTE.LIST`, `PROV.DISPUTE.GET`,
  `PROV.DISPUTE.EVIDENCE.LIST`, `PROV.DISPUTE.RESPOND`,
  `PROV.DISPUTE.RESPONSES.LIST`.
- `ProviderDisputesService` with:
  - list (optional status and booking filters),
  - single dispute fetch with ownership check,
  - evidence read with ownership check,
  - respond with validation (kind enum, body required) and ownership check,
  - responses list with ownership check.
- Router prefix `/providers/me/disputes`:
  - `GET /` — list disputes
  - `GET /{dispute_id}` — single dispute
  - `GET /{dispute_id}/evidence` — dispute evidence
  - `POST /{dispute_id}/responses` — submit a response
  - `GET /{dispute_id}/responses` — list responses

Dispute resolution stays platform/admin-side in this phase — the provider
sees dispute state and can respond, but the resolution decision is not theirs.

## Phase 40 — Provider Support

Provider-side helpdesk, mirroring the existing customer support surface
(`SUPPORT_TICKETS`/`TICKET_MESSAGES`) as its own provider-owned domain
rather than sharing the customer tables.

- `PROVIDER_SUPPORT_TICKETS` + `PROVIDER_TICKET_MESSAGES`, FK'd to
  `PROVIDERS(provider_id)`.
- Governed queries `PROV.SUPPORT.TICKET.CREATE/GET/LIST`,
  `PROV.SUPPORT.MESSAGE.ADD`, `PROV.SUPPORT.MESSAGES.LIST`.
- `ProviderSupportService` with category/priority validation, ownership
  checks on every ticket/message access, and a closed-ticket message block.
- Router prefix `/providers/me/support`:
  - `POST /tickets` — open a ticket
  - `GET /tickets` — list tickets
  - `GET /tickets/{ticket_id}` — single ticket
  - `POST /tickets/{ticket_id}/messages` — add a message
  - `GET /tickets/{ticket_id}/messages` — list messages

While building this, an audit of the underlying query executor surfaced
three independent, previously-undiscovered bugs silently breaking every
read/update/delete call in Modules 32-39 (Commission Fees, Invoices,
Reviews, KPIs, Ranking, Portfolio, Notifications, DSL Requests, Disputes):
an ownership-filter bind-param naming mismatch, a `:name::type` cast
syntax that SQLAlchemy's text() bind-param parser mis-tokenizes, and
unquoted DSL table names that Postgres folded to the wrong case. All were
fixed and verified live against Postgres — see the "repair silent runtime
failures across Modules 32-39" commit for the full detail.

## Phase 41 — Provider Safety & Incident Reporting

A prior, incomplete attempt at this phase (service/router source deleted,
orphaned `PROV.SAFETY.REPORTS.*` registry entries left pointing at missing
SQL files, router registration disabled via a TEMP STOPGAP) was replaced
with a complete implementation.

- `PROVIDER_SAFETY_REPORTS` — provider-filed safety/incident reports,
  optionally tied to a booking (FK'd to `PROVIDERS(provider_id)` and
  nullable-FK'd to `BOOKINGS(booking_id)`).
- Governed queries `PROV.SAFETY.REPORTS.CREATE/LIST/GET/ESCALATE` (the
  create query enforces, in SQL, that a named booking belongs to the
  reporting provider before inserting).
- `ProviderSafetyService` with category/severity validation, ownership
  checks, and an escalate action restricted to `OPEN`/`UNDER_REVIEW`
  reports (idempotency guard: a second escalate raises a conflict).
  Resolution stays platform/admin-side, mirroring Disputes (Phase 39).
- Router prefix `/providers/me/safety`:
  - `POST /reports` — file a report
  - `GET /reports` — list reports (optional status/category filters)
  - `GET /reports/{report_id}` — single report
  - `POST /reports/{report_id}/escalate` — escalate to platform admins

## Phase 42 — Provider Recurring Customers

A "recurring customer" here means a repeat customer of a specific
provider — 2+ completed (`CLOSED`) bookings with them — computed on the
fly from `BOOKINGS`. This is a distinct concept from the customer-side
`RECURRING_SERVICES` subscription system (Module 22-ish, customer-owned
auto-rebooking), which has no `provider_id` and re-matches from scratch
each cycle, so it can't itself express a provider-customer relationship.

- `PROVIDER_CUSTOMER_NOTES` — the only new state: a provider's private
  note about a repeat customer (composite PK `provider_id, customer_id`).
- Governed queries `PROV.RECURRING_CUSTOMERS.LIST` (2+ CLOSED bookings,
  `HAVING COUNT(*) >= 2`), `.GET`, `.BOOKINGS` (completed booking history
  with this provider), `.NOTE.SET` (upsert, gated in SQL on the provider
  actually having a CLOSED booking with that customer).
- `ProviderRecurringCustomersService` with ownership checks throughout.
- Router prefix `/providers/me/recurring-customers`:
  - `GET /` — list repeat customers
  - `GET /{customer_id}` — one customer's summary + note
  - `GET /{customer_id}/bookings` — completed booking history
  - `PUT /{customer_id}/note` — set/update the private note

## Phase 43 — Provider Business Customers & Negotiated Rates

A provider-owned registry of business/corporate customers with an agreed
negotiated rate (percent discount or fixed rate). Applying the rate to a
live quote is out of scope for this phase — this establishes the
relationship and rate the provider has agreed with the customer.

- `PROVIDER_BUSINESS_CUSTOMERS` — one row per (provider, customer),
  unique-constrained, with `negotiated_rate_type` (`PERCENT_DISCOUNT` |
  `FIXED_RATE`) and `negotiated_rate_value`, plus company name/notes.
- Governed queries `PROV.BUSINESS_CUSTOMERS.CREATE/LIST/GET/UPDATE/
  DEACTIVATE`.
- `ProviderBusinessCustomersService` validates the rate (percent capped
  at 100, value non-negative); the adapter translates the unique-
  constraint violation on duplicate registration into a clean
  `ConflictError` (established pattern, see
  `provider_service_area_sql_adapter.py`) instead of a raw 500.
- Router prefix `/providers/me/business-customers`:
  - `POST /` — register a business customer
  - `GET /` — list (optional status filter)
  - `GET /{record_id}` — single record
  - `PATCH /{record_id}` — update rate/company/notes
  - `POST /{record_id}/deactivate` — end the relationship

## Phase 44 — Provider Team Management (workers/roles)

A provider's roster of workers/technicians with a role, managed by the
provider account (the owner). This establishes a stable `member_id` that
Job Assignment (Phase 45) will reference; it does not itself grant the
member independent login credentials — that would be a separate,
larger auth undertaking out of scope here.

- `PROVIDER_TEAM_MEMBERS` — unique-constrained on (provider_id, phone),
  role restricted to `OWNER | MANAGER | TECHNICIAN | DISPATCHER | OTHER`.
- Governed queries `PROV.TEAM.MEMBER.CREATE/GET/UPDATE/DEACTIVATE`,
  `PROV.TEAM.MEMBERS.LIST`.
- `ProviderTeamService` validates name/phone/role; the adapter
  translates the duplicate-phone unique-constraint violation into a
  clean `ConflictError` on both create and update.
- Router prefix `/providers/me/team`:
  - `POST /` — add a team member
  - `GET /` — list roster (optional status/role filters)
  - `GET /{member_id}` — single member
  - `PATCH /{member_id}` — update details/role
  - `POST /{member_id}/deactivate` — remove from active roster

## Phase 45 — Provider Job Assignment (dispatch/technician)

Links a booking to one of the provider's team members (Phase 44). One
active assignment per booking (unique constraint on `booking_id`);
reassigning updates the existing row rather than creating history — a
full audit trail is Phase 51's concern.

- `PROVIDER_JOB_ASSIGNMENTS` — FK'd to `PROVIDERS`, `BOOKINGS`
  (unique), and `PROVIDER_TEAM_MEMBERS`; status lifecycle `ASSIGNED →
  ACKNOWLEDGED → IN_PROGRESS → COMPLETED`, or `CANCELLED`.
- Governed queries `PROV.JOB_ASSIGNMENTS.CREATE/GET/UPDATE/CANCEL`,
  `.LIST`. Create enforces in SQL that both the booking and the team
  member belong to this provider, and the member is `ACTIVE`; update's
  reassignment path re-validates the new member the same way.
- `ProviderJobAssignmentsService` with status validation; the adapter
  translates unique-constraint (duplicate booking assignment) and
  check-constraint violations into clean `ConflictError`s.
- Router prefix `/providers/me/job-assignments`:
  - `POST /` — assign a team member to a booking
  - `GET /` — list (optional status/member filters)
  - `GET /{assignment_id}` — single assignment
  - `PATCH /{assignment_id}` — reassign member and/or change status/notes
  - `POST /{assignment_id}/cancel` — cancel an active assignment

## Phase 46 — Provider Equipment & Tools Registry

A provider's tools/equipment, optionally checked out to a team member
(Phase 44). While building this, an `asyncpg.exceptions.DataError:
'str' object has no attribute 'toordinal'` was hit binding a raw JSON
string to a `date`-typed column — asyncpg's prepared-statement protocol
requires an actual `datetime.date` object once the target column type
is known, unlike an untyped text comparison. Fixed by typing the
`purchase_date` field as `date | None` on the Pydantic request model so
FastAPI parses it before it reaches the service. The same bug pattern
was found (confirmed live) in the existing Portfolio module's
`completed_on` field and flagged as a separate follow-up task rather
than fixed here, to keep this phase's diff scoped to Equipment.

- `PROVIDER_EQUIPMENT` — category/condition/status enums enforced via
  CHECK constraints; `assigned_member_id` nullable-FK's to
  `PROVIDER_TEAM_MEMBERS`.
- Governed queries `PROV.EQUIPMENT.CREATE/GET/UPDATE/ASSIGN/RETIRE`,
  `.LIST`. Assign enforces in SQL that a new assignee is an `ACTIVE`
  member of this provider, and blocks assigning equipment under
  `MAINTENANCE` or `RETIRED`.
- `ProviderEquipmentService` with category/condition/status validation.
- Router prefix `/providers/me/equipment`:
  - `POST /` — register equipment
  - `GET /` — list (optional status/category filters)
  - `GET /{equipment_id}` — single record
  - `PATCH /{equipment_id}` — update details/condition/status
  - `POST /{equipment_id}/assign` — check out to a member, or release
    (`member_id: null`)
  - `POST /{equipment_id}/retire` — retire (terminal)

## Phase 47 — Provider Documents & Compliance (expiry)

Discovered during this phase: the data model this phase calls for
already exists — Phase 5's `PROVIDER_VERIFICATION_DOCUMENTS` (identity
documents + review workflow) already has an `expiry_date` column, and
its `PRV.VER.STATUS` aggregate already counts documents expiring soon.
What was missing was a way to see *which* documents those are, so a
provider can actually act on it — so this phase extends Phase 5 rather
than introducing a new table.

- New governed query `PRV.VER.DOCS.EXPIRING`, added to the existing
  `ProviderVerificationRepository`/`ProviderVerificationSqlAdapter`
  (`app/adapters/persistence/provider_verification_sql_adapter.py`,
  `PRV.VER.*` prefix, matching that file's existing convention) rather
  than a parallel adapter for the same table. Only `VERIFIED` documents
  are considered "in force" and thus meaningfully expiring.
- New `ProviderVerificationService.expiring_documents()` method
  (`within_days`, validated 1-365).
- Note: `PRV.VER.STATUS`'s existing `documents_expiring_soon` counts
  documents where `status <> 'VERIFIED'`, which is a different
  (arguably backwards) definition from this phase's `VERIFIED`-only
  view. Left untouched — it predates this phase and changing Phase 5's
  existing aggregate semantics was out of scope for this addition.
- Router prefix `/providers/me/compliance`:
  - `GET /documents/expiring?within_days=30` — verified documents
    nearing or past expiry, soonest first, each flagged `is_expired`

## Phase 48 — Provider Promotions

A provider's own discount codes, distinct from the platform-wide
`PROMOTIONS` table (Phase 12), which has no `provider_id` at all —
platform promos apply regardless of which provider a customer books.

- `PROVIDER_PROMOTIONS` — unique on `(provider_id, code)`;
  `discount_type` restricted to `PERCENT | FIXED_AMOUNT`; CHECK
  constraints enforce a non-negative discount and `valid_until >
  valid_from`.
- Governed queries `PROV.PROMOTIONS.CREATE/GET/UPDATE/DEACTIVATE/
  VALIDATE/REDEEM`, `.LIST` — `VALIDATE`/`REDEEM` mirror the existing
  customer-side `CUS.PROMOTION.VALIDATE`/`.USE` pattern (same discount-
  amount formula), scoped to the provider's own codes.
- `ProviderPromotionsService`: discount-type/value/date-range
  validation; the adapter translates unique/check-constraint violations
  into clean `ConflictError`s.
- Not wired into the live quotation/booking pricing pipeline — that
  cross-domain integration is a separate, larger undertaking. This
  phase establishes the registry and validate/redeem read-and-write
  paths a provider's own checkout UI can call directly.
- Router prefix `/providers/me/promotions`:
  - `POST /` — create a promotion
  - `GET /` — list (optional active filter)
  - `GET /{promo_id}` — single record
  - `PATCH /{promo_id}` — update terms
  - `POST /{promo_id}/deactivate` — turn off
  - `POST /validate` — resolve a code against an order amount
  - `POST /{promo_id}/redeem` — consume one use

## Phase 49 — Provider Analytics

A read-only monthly trend view, computed at query time directly from
`BOOKINGS`/`PROVIDER_REVIEWS` rather than the `PROVIDER_KPIS` table
(Phase 34, populated by a separate, not-necessarily-run batch job) —
genuinely new ground versus the existing Dashboard (today/this-week
snapshot) and KPIs (per-period stored rows) views, not a duplicate of
either.

- No new table. Governed query `PROV.ANALYTICS.OVERVIEW`: a
  `generate_series`-backed month scaffold, left-joined to completed-
  booking counts/revenue, average review rating, and a new-vs-repeat
  customer split (a customer's first-ever `CLOSED` booking with this
  provider falls in exactly one month as "new"; any later month they
  book again counts them as "repeat" that month). Zero-fills months
  with no activity rather than omitting them.
- `ProviderAnalyticsService` validates the requested window (1-24
  months).
- Router prefix `/providers/me/analytics`:
  - `GET /overview?months=6` — monthly trend, chronological, oldest
    first, ending in the current month

## Phase 50 — Provider Settings (notifications/security/privacy)

Personal and business info editing already exist
(`provider_profile_service`, `provider_business_service`) and are
untouched by this phase. What was missing — mirrored from the customer-
side `app/domains/accounts/services/account_service.py` and its
`CUSTOMER_PREFERENCES`/`CONSENTS`/`DATA_EXPORT_REQUESTS` tables — was
notification preferences, an authenticated password-change flow, and
privacy consent/export management for providers.

- Migration 0068: `PROVIDER_PREFERENCES`, `PROVIDER_CONSENTS`,
  `PROVIDER_DATA_EXPORT_REQUESTS` — direct mirrors of the customer
  tables. Security reuses the existing `PROVIDERS.password_hash` and
  `PROVIDER_AUTH_SESSIONS` — no new table for that facet; only a new
  `PROV.AUTH.PROVIDER.BY_ID_WITH_HASH` query and `get_by_id_with_hash()`
  method added to the existing `ProviderAccountSqlAdapter` (mirroring
  the customer auth adapter's identical internal-only query).
- New `ProviderPreferenceService`/`ProviderSecurityService`/
  `ProviderPrivacyService` in `provider_settings_service.py`, mirroring
  the customer `PreferenceService`/`SecurityService`/`PrivacyService`
  trio in one file.
- Found and fixed while verifying: `revoke_all_sessions` on a provider
  with no active sessions is a legitimate no-op, not a failure — the
  underlying `UPDATE ... RETURNING` is empty either way, so the service
  no longer raises on an empty result.
- Router prefix `/providers/me/settings`:
  - `GET`/`PUT /preferences` — list / upsert a key-value preference
  - `POST /security/change-password` — verifies the current password
    before hashing and storing the new one
  - `POST /security/revoke-sessions` — end all other sessions
  - `GET`/`PUT /privacy/consents` — list / set a consent
    (`MARKETING`/`ANALYTICS`/`COMMUNICATION`)
  - `POST`/`GET /privacy/export-requests` — request / list data exports

## Phase 51 — Provider Activity & Audit History

A generic, append-only activity log. Deliberately scoped to the log
itself plus its first real producers, not a retrofit of every prior
module's write paths — wiring audit calls into all ~15 modules built
this session would be a much larger, separate, higher-risk undertaking
than one roadmap line item justifies.

- `PROVIDER_ACTIVITY_LOG` — `action` (free-form, e.g.
  `SECURITY.PASSWORD_CHANGED`), optional `entity_type`/`entity_id`, and
  a `metadata` JSONB column.
- Write access is internal-only: `PROV.ACTIVITY_LOG.RECORD` is called
  by services, never exposed as a provider-facing endpoint — a provider
  cannot fabricate their own audit trail. `PROV.ACTIVITY_LOG.LIST` is
  the read path.
- `ProviderActivityLogService.record()` JSON-serializes `metadata`
  before it reaches the adapter — asyncpg needs an actual JSON string
  (or `None`) for a JSONB bind, not a raw Python dict; passing a dict
  directly fails with `DataError: 'dict' object has no attribute
  'encode'`. The identical bug pattern was found (confirmed live) in
  the existing DSL Requests module's `dsl` field (Phase 38) and flagged
  as a separate follow-up rather than fixed here.
- Wired as the first two real producers: `ProviderSecurityService.
  change_password()`/`.revoke_all_sessions()` (Phase 50) now call
  `record()` after succeeding, via an optional `activity_log`
  constructor argument (`None`-guarded, so the service still works
  standalone/in tests without it).
- Router prefix `/providers/me/activity` (read-only):
  - `GET /?action_prefix=SECURITY.` — list entries, optionally filtered
    by an action-name prefix

## Phase 52 — Provider Subscription / Plans

A plan catalogue and subscription lifecycle only — not wired into live
commission calculation or feature gating in other modules (e.g. Team
Management's roster size vs. a plan's `max_team_members`), which would
be a separate, larger cross-cutting undertaking than this phase covers.

- `PROVIDER_PLANS` — platform-managed catalogue, seeded with four tiers
  (FREE/BASIC/PRO/PREMIUM). `PROVIDER_SUBSCRIPTIONS` — a provider's
  subscription history; at most one `ACTIVE` row per provider (partial
  unique index).
- Governed queries `PROV.PLANS.LIST` (public catalogue, no ownership
  filter), `PROV.SUBSCRIPTIONS.CURRENT/SUBSCRIBE/CANCEL/HISTORY`.
  `SUBSCRIBE` atomically cancels any current active subscription and
  starts a new one via CTEs, gated so an invalid/inactive `plan_id`
  leaves the existing subscription untouched.
- Found and fixed while verifying: the `cancel_existing` CTE wasn't
  referenced anywhere in the final `INSERT ... SELECT`, so Postgres had
  no guarantee it would execute before the insert's uniqueness check —
  switching plans intermittently violated
  `UQ_PROVIDER_SUBSCRIPTION_ACTIVE` even though the cancel "should"
  have made room for the new row. Fixed with a `LEFT JOIN
  cancel_existing ON true` to force the data dependency.
- Router prefix `/providers/me/subscription`:
  - `GET /plans` — public plan catalogue
  - `GET /` — current active subscription
  - `POST /subscribe` — subscribe or switch plans
  - `POST /cancel` — cancel the active subscription
  - `GET /history` — subscription history

## Phase 53 — Provider Account Restrictions & Status

A log of platform-imposed restrictions (warnings, suspensions, feature
limits, bans), read-only from the provider side — imposing/lifting one
is a platform/admin action, mirroring Disputes' (Phase 39) "resolution
stays platform-side" convention. Deliberately does not modify
`PROVIDERS.status` or touch auth/login logic — wiring restrictions into
live enforcement (blocking login, blocking bookings) is a separate,
larger, higher-risk undertaking than this phase covers.

- `PROVIDER_ACCOUNT_RESTRICTIONS` — `restriction_type` restricted to
  `WARNING | SUSPENSION | FEATURE_LIMIT | BAN`.
- Governed queries `PROV.ACCOUNT_RESTRICTIONS.IMPOSE/LIFT` (admin-side,
  `ownership_filter_required: false` — not scoped to a caller's own
  resource) and `.LIST_ACTIVE`/`.HISTORY` (provider-facing, ownership-
  scoped).
- `ProviderAccountRestrictionsService.impose()`/`.lift()` are kept for
  the admin module to call later; no provider-facing endpoint exposes
  them in this phase.
- Router prefix `/providers/me/account-status` (read-only):
  - `GET /` — summary: whether the account is currently restricted,
    plus the active restrictions
  - `GET /history` — full restriction history

## Phase 54 — Provider Account Closure

Mirrors the customer-side account closure flow (Phase 15's
`AccountClosureService`/`ACCOUNT_CLOSURES`/`SP_DELETE_ACCOUNT`) for
providers, at identical scope — a schedule-only action; the customer
side has no reversal endpoint either despite its table carrying
`reversed_at`/`is_reversal` columns, and this phase does not touch
provider auth/login logic (consistent with Phase 53 leaving
`PROVIDERS.status`/enforcement alone).

- Migration 0072: adds `PROVIDERS.deleted_at`/`is_deleted` (previously
  absent — the column customer accounts already had, providers never
  did), `PROVIDER_ACCOUNT_CLOSURES`, and a `SP_DELETE_PROVIDER_ACCOUNT`
  stored procedure mirroring `SP_DELETE_ACCOUNT` exactly (inserts a
  closure record, soft-deletes the provider row).
- Governed query `PROV.ACCOUNT.CLOSURE.SCHEDULE` calls the SP.
- `ProviderAccountClosureService.schedule_closure()` mirrors
  `AccountClosureService` structurally.
- Endpoint added to the existing Phase 50 settings router rather than a
  new router file, since it's one action with no facet of its own:
  `POST /providers/me/settings/closure`.

This completes Provider Modules 40-54 (PRV-40 through PRV-54), the full
set requested after the Provider Backend audit (Modules 1-35) and the
Modules 32-39 runtime-failure repair.
