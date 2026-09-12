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
| PRV-27 | 27 | Final Billing | ⏳ next |
| PRV-28 | 28 | Provider Earnings | ⏳ |
| PRV-29 | 29 | Provider Wallet | ✅ `provider-phase29-v1` |
| PRV-30 | 30 | Payout Management — methods + withdrawals | ✅ `provider-phase30-v1` |
| PRV-31 | 31 | Commission & Fees — gross/commission/tax/net | ⏳ |
| PRV-32 | 32 | Invoices & Statements | ⏳ |
| PRV-33 | 33 | Ratings & Reviews | ⏳ |
| PRV-34 | 34 | Provider Performance KPIs | ⏳ |
| PRV-35 | 35 | Provider Ranking & Reputation | ⏳ |
| PRV-36 | 36 | Portfolio | ⏳ |
| PRV-37 | 37 | Provider Notifications | ⏳ |
| PRV-38 | 38 | Cancellations & Rescheduling | ⏳ |
| PRV-39 | 39 | Disputes | ⏳ |
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

Verification: `cd applications/backend && python -m pytest` stays green (new unit
tests included per phase); each phase ships migration + queries + port/adapter +
service + router + wiring + tests + its own commit/tag.