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
| PRV-40 | 40 | Provider Support | ⏳ |
| PRV-41 | 41 | Safety & Incident Reporting | ⏳ |
| PRV-42 | 42 | Recurring Customers | ⏳ |
| PRV-43 | 43 | Business Customers + negotiated rates | ⏳ |
| PRV-44 | 44 | Team Management — workers/roles | ⏳ |
| PRV-45 | 45 | Job Assignment — dispatch/technician | ⏳ |
| PRV-46 | 46 | Equipment & Tools registry | ⏳ |
| PRV-47 | 47 | Documents & Compliance + expiry | ⏳ |
| PRV-48 | 48 | Promotions | ⏳ |
| PRV-49 | 49 | Provider Analytics | ⏳ |
| PRV-50 | 50 | Provider Settings (personal/business/notifications/security/privacy) | ⏳ |
| PRV-51 | 51 | Provider Activity & Audit History | ⏳ |
| PRV-52 | 52 | Subscription / Provider Plans | ⏳ |
| PRV-53 | 53 | Account Restrictions & Status | ⏳ |
| PRV-54 | 54 | Account Closure | ⏳ |
| PRV-31 | 31 | Commission & Fees | ✅ |
| PRV-32 | 32 | Provider Notifications | ✅ |

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
