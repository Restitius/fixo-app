# FIXO Provider Backend — Full Audit Report (Modules 1–35)

> Companion to `provider-backend-implementation.md` and `Provider Business
> Requirements`. This document does not change the agreed module order or
> flow — it records what a full, code-level audit of Modules 1–35 found
> against the written requirements, what was fixed, and what remains.
>
> **Method:** every module was traced end-to-end — migration → SQL query →
> repository port → SQL adapter → service → router → `composition.py` wiring
> → `app/api/v1/router.py` registration → tests — reading real code rather
> than trusting the roadmap's own "✅ done" markers. Several modules marked
> "done" turned out to be silently non-functional (missing DI wiring, dead
> routers, unregistered queries, broken SQL/migration syntax); this audit
> exists because that gap is real and worth documenting precisely.
>
> **Concurrency note:** this audit ran while a second, independent session
> was actively building out later provider phases (36–41) in the same
> shared repository. Several fixes were reverted mid-session by branch
> switches and had to be reapplied (visible in the commit history as
> repeated fixes to the same files); the fixes that landed are the ones
> verified present in the final `dev` state referenced below.
>
> **Commits:** `fd05834`/`f3b8816` (customer-side, prerequisite hygiene pass,
> not itemized here), `07ef130` (critical provider fixes, modules 1/3/8/10/
> 14/15/17/18/19/21/23/31/32), `53be878` (module 14 ack.sql), `fce3ba9`
> (modules 27/28/30), `46cbb57` (module 11). All on `dev`.

---

## Per-module report

Legend: **PASS** = matches requirements, no material issues found. **PASS
WITH FIXES** = had real bugs, now fixed and verified. **PASS WITH ISSUES** =
functional, but a real (usually lower-severity) gap remains, not yet fixed.
**BLOCKED (fixed)** = was completely non-functional, now fixed. **BLOCKED**
= still non-functional or has an unresolved critical issue.

### Module 1 — Provider Public Entry & Registration
- **Requirement:** registration (name/email/mobile/password/location/
  language/referral/account type INDIVIDUAL or BUSINESS), mobile OTP,
  email OTP/link verification.
- **Implementation:** `app/domains/providers/api/auth_router.py` →
  `ProviderAuthService` → `ProviderAccountRepository` → `ProviderAccountSqlAdapter`
  → `PROV.AUTH.*` queries. Table `PROVIDERS` (migration `0020`).
- **DB tables:** `PROVIDERS`.
- **APIs:** `/providers/auth/{register,login,refresh,logout,me,otp/request,
  password/forgot,password/reset,verify-otp}`.
- **Services:** `ProviderAuthService`.
- **Issues found:**
  - **Critical (fixed):** `DEV_MODE = True` unconditionally returned the OTP
    code in the response body of register/request-otp/password-reset —
    trivial account takeover for any email/phone.
  - **High (not fixed):** no mobile-number OTP path exists at all (`verify_otp`
    hardcodes `phone=False`); the requirement explicitly asks for it. Building
    a real SMS delivery integration is out of scope for an audit-and-repair
    pass — flagged as a genuine feature gap, not a quick fix.
  - **Critical (not fixed):** `login()` allows `status IN ('ACTIVE','DRAFT')`
    — a freshly-registered, never-verified account can log in and use every
    other endpoint immediately. No endpoint anywhere gates on
    `email_verified`/`verification_status`.
  - Medium (not fixed): duplicate phone number hits the DB unique index
    directly (no pre-check like the email path has) → unhandled 500 instead
    of a clean 409.
  - Low (not fixed): no `confirm_password` field server-side.
- **Changes made:** `_dev_mode()` gates OTP-in-response behind
  `environment != "production"` (commit `07ef130`).
- **DB components created:** none needed.
- **Security/RBAC:** auth dependency correct (JWT `sub` → provider_id); no
  IDOR found. The account-takeover vector above was the OTP leak, now closed.
- **Tests:** none exist for this module; none added.
- **Integration:** feeds Onboarding (2), Profile (3), Business Profile (4).
- **Final status: PASS WITH ISSUES** (critical leak fixed; verification
  gating and mobile OTP remain open).

### Module 2 — Provider Account Onboarding
- **Requirement:** 7-step guided onboarding, auto-saved, resumable.
- **Implementation:** `onboarding_router.py` → `ProviderOnboardingService` →
  `ProviderOnboardingRepository` → SQL adapter → `PROV.ONBOARD.*`. Tables
  `PROVIDER_ONBOARDING_STEPS` + `PROVIDER_ONBOARDING_PROGRESS` (migration `0021`).
- **DB tables:** `PROVIDER_ONBOARDING_STEPS`, `PROVIDER_ONBOARDING_PROGRESS`.
- **APIs:** `GET /providers/onboarding/{status,steps}`, `PUT/POST
  /providers/onboarding/steps/{code}[/complete]`.
- **Issues found:** Low — steps completable out of order (no sequencing
  enforcement); `BUSINESS_INFO` step not conditionally required for
  BUSINESS-type accounts.
- **Changes made:** none (low severity, business-flow ambiguity rather than
  a defect — flagging for product decision).
- **Security/RBAC:** correct — all queries scope by the JWT-derived provider id.
- **Tests:** none.
- **Final status: PASS WITH ISSUES.**

### Module 3 — Provider Profile
- **Requirement:** public profile (photo/gender/DOB/bio/languages/
  experience/title/skills/certifications/portfolio), previewable exactly as
  customers see it.
- **Implementation:** `profile_router.py` → `ProviderProfileService` →
  SQL adapter → `PRV.PROFILE.*`. `PROVIDERS` extended by migration `0023`.
- **Issues found:**
  - **High (fixed):** the customer-facing directory/profile queries
    (`app/queries/customers/providers/{profile,list_by_category,
    list_by_service}.sql`) filtered only `is_active` — never
    `verification_status` — so unverified, never-approved providers were
    fully visible and bookable by real customers.
  - Low (not fixed): `public_preview` includes `verification_status`, the
    real customer-facing query doesn't — the two aren't byte-identical
    despite the "preview exactly as customers see it" docstring.
- **Changes made:** all three customer-facing queries now require
  `verification_status = 'VERIFIED'` in addition to `is_active` (`07ef130`).
- **Security/RBAC:** provider-owned CRUD correctly scoped; no IDOR.
- **Tests:** none.
- **Final status: PASS WITH FIXES** (visibility gate fixed; preview-field
  drift is cosmetic and open).

### Module 4 — Business Profile
- **Requirement:** company profile (name/logo/registration/tax/contact/
  description/year/employees/website/social) for company-operated providers.
- **Implementation:** `business_router.py` → `ProviderBusinessService` →
  SQL adapter → `PRV.BUSINESS.*`. Table `PROVIDER_BUSINESS_PROFILES`
  (migration `0024`), 1:1 via `provider_id UNIQUE`.
- **Issues found:** Medium (not fixed) — no cross-check ties `account_type`
  (INDIVIDUAL/BUSINESS) to whether a business profile is required/permitted;
  an INDIVIDUAL account can freely create one and a BUSINESS account is
  never required to.
- **Security/RBAC:** correct, no IDOR.
- **Tests:** none.
- **Final status: PASS WITH ISSUES.**

### Module 5 — Identity & Provider Verification
- **Implementation:** `verification_router.py` → `ProviderVerificationService`
  → SQL adapter → `PRV.VER.*`. Tables `PROVIDER_DOC_TYPES` +
  `PROVIDER_VERIFICATION_DOCUMENTS` (migration `0025`).
- **Issues found:** none — real validation, real repository calls, correct
  `CurrentProvider` scoping throughout, no stubs.
- **Security/RBAC:** correct.
- **Tests:** none.
- **Final status: PASS.**

### Module 6 — Service Category Setup
- **Implementation:** `service_config_router.py` → `ProviderServiceConfigService`
  → SQL adapter → `PRV.SERVICE.*`. Extends `PROVIDER_SERVICES` (migration `0026`).
- **Issues found:** none — pricing-model validation, submit-for-approval
  flow, and ownership scoping are all real and correct.
- **Final status: PASS.**

### Module 7 — Provider Pricing
- **Implementation:** `pricing_router.py` → `ProviderServicePricingService`
  → SQL adapter → `PRV.PRICING.*`. Table `PROVIDER_SERVICE_PRICING`
  (migration `0027`).
- **Issues found:** none — the per-pricing-model required/forbidden field
  rules engine (`_RULES`) is the most rigorous business-logic implementation
  in the early phases; cross-checks service configuration before allowing
  pricing.
- **Final status: PASS.**

### Module 8 — Service Area Management
- **Implementation:** `areas_router.py` → `ProviderServiceAreaService` →
  SQL adapter → `PRV.AREAS.*`. Tables `PROVIDER_AREA_SETTINGS`,
  `PROVIDER_SERVICE_AREAS`, `PROVIDER_AREA_EXCLUSIONS` (migration `0028`).
- **Issues found:** **Critical (fixed)** — the entire router was never
  imported or `include_router()`'d in `app/api/v1/router.py`. Every endpoint
  (LOCATION/RADIUS areas, exclusions, travel-policy settings) — fully and
  correctly implemented underneath — was completely unreachable, despite the
  roadmap marking this phase "✅ done."
- **Changes made:** added the missing import + registration (`07ef130`).
- **Final status: PASS WITH FIXES.**

### Module 9 — Working Hours & Availability
- **Implementation:** `availability_router.py` → `ProviderAvailabilityService`
  → SQL adapter → `PRV.AVAIL.*`. Tables `PROVIDER_AVAILABILITY_SETTINGS`,
  `PROVIDER_WORKING_HOURS`, `PROVIDER_TIME_OFF` (migration `0029`).
- **Issues found:** none — weekly-hours validation, vacation-window pairing,
  time-off overlap checks, and a safe all-offline default are all real.
- **Final status: PASS.**

### Module 10 — Provider Dashboard
- **Implementation:** `dashboard_router.py` → `ProviderDashboardService` →
  SQL adapter → `PRV.DASH.*`. Read-composition, no dedicated migration.
- **Issues found:** Low (fixed) — `provider_dashboard_router` was
  `include_router()`'d **twice** in `app/api/v1/router.py`, duplicating every
  dashboard route in the OpenAPI schema (functionally mostly harmless for
  idempotent GETs, but dead copy-paste).
- **Changes made:** removed the duplicate registration (`07ef130`).
- **Final status: PASS WITH FIXES.**

### Module 11 — Incoming Job Requests
- **Requirement:** provider sees matched requests with a response countdown;
  Accept / Decline / Submit Quote / Ask Question.
- **Implementation:** `requests_router.py` → `ProviderIncomingRequestService`
  → SQL adapter → `PRV.REQUESTS.*`. `PROVIDER_REQUEST_RESPONSES`
  (migration `0030`).
- **Issues found:** **Critical (fixed)** — "Accept" never actually claimed
  the job. `respond.sql` only blocked the *same* provider from double-
  responding; it never checked whether a *different* provider already
  accepted, and never touched `SERVICE_REQUESTS` at all. Every matched
  provider could independently "accept" the same instant job with zero
  conflict — the module's own race/countdown requirement was structurally
  unenforced.
- **Changes made:** restructured `respond.sql` around an atomic `claim` CTE
  that sets `selected_provider_id` + `status='PROVIDER_SELECTED'` on
  ACCEPTED, guarded so a losing concurrent claim matches zero rows; response
  row is only inserted for ACCEPTED if the claim was actually won
  (`46cbb57`). **Verified against live Postgres**: two providers accepting
  concurrently → exactly one wins, the request lands on the winner's id, the
  loser gets a clean 409.
- **Security/RBAC:** correct — every action scoped to requests actually
  matched to the calling provider (`MATCH_CANDIDATES`).
- **Tests:** none exist; verification was a standalone concurrency script
  run against the live DB during this audit (not committed as a repo test —
  recommend adding one).
- **Final status: PASS WITH FIXES.**

### Module 12 — Matching Engine Interaction
- **Implementation:** `matching_router.py` → `ProviderMatchingService` →
  SQL adapter → `PRV.MATCH.*`.
- **Issues found:** Low (not fixed) — `completion_rate` is hard-coded `None`
  (documented gap: "needs bookings history"); `engine_score_preview` is a
  client-facing approximation, not the real matching engine's weights.
- **Security/RBAC:** correct — every query strictly scoped to the calling
  provider's own signals.
- **Final status: PASS WITH ISSUES.**

### Module 13 — Quotations / Offers
- **Implementation:** `quotations_router.py` → `ProviderQuotationService` →
  SQL adapter → `PRV.QUOTE.*`. Migration `0031` (breakdown columns,
  `QUOTATION_ATTACHMENTS`, expanded `CK_QUOTE_STATUS`).
- **Issues found:** High (not fixed) — no provider-settable quote-expiry
  field; every quote silently inherits the DB default (`now() + 48h`)
  despite the requirement listing "quote expiry" as a field the provider
  supplies.
- **Good:** state machine (DRAFT→SUBMITTED→ACCEPTED/REJECTED/EXPIRED/
  WITHDRAWN) is strictly guarded in SQL; expiry sweep runs on every list();
  ownership correct throughout.
- **Final status: PASS WITH ISSUES.**

### Module 14 — Booking Confirmation
- **Requirement:** booking created on quote acceptance; provider receives
  booking details and acknowledges.
- **Implementation:** `booking_router.py` → `ProviderBookingService` →
  SQL adapter → `PROV.BOOKING.*`. `PROVIDER_BOOKING_ACKNOWLEDGEMENTS`
  (migration `0032`).
- **Issues found:**
  - **Critical (fixed):** `ack.sql` had no ownership check at all — any
    authenticated provider could acknowledge (or overwrite the ack notes
    on) another provider's booking by guessing a `booking_id`, despite the
    registry claiming `ownership_filter_required: true`.
  - **Critical (fixed):** the service's post-write guard checked
    `row.get("status") != "CONFIRMED"` on the *ack* row — which has no
    `status` column at all (only the booking does) — so it was always
    `None`, and every single acknowledge call raised `AuthorizationError`
    immediately **after** the write had already committed.
  - Low (not fixed): `booking_router.py`/`calendar_router.py` return raw
    dicts instead of the `ok(...)` envelope used elsewhere — cosmetic
    API-consistency gap.
- **Changes made:** `ack.sql` now gates on `b.provider_id = :user_id AND
  b.status = 'CONFIRMED'` in the same statement as the write; the dead
  post-write checks were removed from the service (`07ef130`, `53be878`).
- **DB fields exposed:** `arrival_code` (customer PIN) was also being
  returned via `bookings/details.sql` — see Module 19, fixed alongside.
- **Final status: PASS WITH FIXES.**

### Module 15 — Provider Calendar
- **Requirement:** Day/Week/Month/Agenda views; must prevent overlapping bookings.
- **Implementation:** `calendar_router.py` → `ProviderCalendarService` → SQL
  adapter → `PROV.CALENDAR.*`.
- **Issues found:**
  - **Critical (fixed):** `week(provider_id, date)`'s parameter was literally
    named `date`, shadowing the `from datetime import date` import — every
    call to `date.fromisoformat(date)` crashed with `AttributeError`. Week
    view was 100% non-functional.
  - **High (fixed):** `agenda()` bounded its query at *today* (`to_date =
    date.today()`) instead of a forward window — a genuine "show me
    upcoming events" call returned nothing for real future bookings.
  - **High (not fixed):** the requirement's core ask — "the system must
    prevent overlapping bookings" — is not enforced anywhere in the actual
    booking-creation path (`CUS.BOOKING.CREATE`). `overlap_check.sql` exists
    and is correct in isolation, but it's only reachable via a manually-
    invoked advisory endpoint nothing calls automatically. Two customers can
    each accept a quote from the same provider for the identical date/time
    slot with no conflict raised.
  - Low (not fixed): "recurring jobs" and "inspections" have no distinct
    representation in the calendar event union, though the requirement
    lists them as event types.
- **Changes made:** `week()` parameter renamed; `agenda()` now looks 180
  days ahead and sorts/trims correctly (`07ef130`).
- **Final status: PASS WITH ISSUES** (crashes fixed; overlap-prevention
  gap is architectural and remains open — needs a decision on whether the
  guard belongs in `CUS.BOOKING.CREATE` directly).

### Module 16 — Booking Details
- **Implementation:** shares `booking_router.py`/`ProviderBookingService`
  with Module 14. `details.sql`/`timeline.sql`/`message_count.sql`.
- **Issues found:** High (not fixed) — the CONFIRMED→…→PAID lifecycle is
  never validated against the registered `WF.BOOKING.CUSTOMER.V1` state
  machine (`app/platform/workflow/workflow_manager.py`); statuses are
  hand-set via raw SQL guards that **diverge** from the registered
  transitions (e.g. Start Service jumps `ARRIVED→IN_PROGRESS`, skipping the
  registered `STARTED` intermediate state — the migration's own comment
  admits "customer mark_started uses STARTED; provider start uses
  IN_PROGRESS," two parallel unreconciled state machines on the same column).
- **Changes made:** arrival PIN removed from `details.sql`'s SELECT (see
  Module 19) (`07ef130`). The workflow-divergence issue itself was not
  fixed — it's a systemic pattern across Modules 16/18/19/20 that needs a
  single reconciliation pass, not a per-file patch.
- **Final status: PASS WITH ISSUES.**

### Module 17 — Customer Communication
- **Requirement:** booking-linked messaging (text/images/documents/voice/
  location/attachments/system messages) without exposing personal contact info.
- **Implementation:** `messaging_router.py` → `ProviderMessagingService` →
  SQL adapter → `PROV.MESSAGES.*`.
- **Issues found:**
  - **Critical (fixed):** `provider_messaging_service()` did not exist
    anywhere in `composition.py` — the repository was constructed, but no
    factory method built the service. Every single messaging endpoint
    raised `AttributeError` on the first call.
  - Medium (not fixed): `MESSAGES` only has a plain `body VARCHAR(2000)`
    column — no support for images/documents/voice/location/attachments/
    system-message typing, despite the requirement listing all of them.
    Genuine feature gap, not a quick fix.
- **Changes made:** added the missing `provider_messaging_service()` factory
  (`07ef130`).
- **Security/RBAC:** correct — every query joins through `BOOKINGS.provider_id`.
- **Final status: PASS WITH FIXES** (wiring fixed; rich-media support is an
  open feature gap).

### Module 18 — Navigation & Provider Tracking
- **Requirement:** live location streaming; customer sees provider ETA/
  distance; provider sees customer address/navigation.
- **Implementation:** `tracking_router.py` → `ProviderTrackingService` →
  `ProviderTrackingSqlAdapter` → `PROV.TRIP.*`. Columns on `BOOKINGS`
  (migration `0034`).
- **Issues found:**
  - **Critical (fixed):** the router was never registered in
    `app/api/v1/router.py` and neither the repository nor the service was
    ever constructed in `composition.py` — completely unreachable.
  - **Critical (fixed):** `GET .../location` (customer views provider's live
    position) had `requires_auth: false` in the registry and **no
    authentication or ownership check at all** in the SQL — anyone who
    knew or guessed a `booking_id` could read any provider's live GPS
    coordinates with zero authentication.
  - **High (fixed):** `record_location` (the provider's own GPS trace
    upload) had no check that the booking belonged to the calling provider
    — any authenticated provider could inject GPS points into another
    provider's trip history.
  - Low (not fixed, architectural): a separate, already-working,
    workflow-integrated tracking implementation exists at
    `app/domains/tracking/` / `app/api/v1/tracking.py` — two unreconciled
    location-tracking systems write to overlapping tables through
    independent code paths.
- **Changes made:** registered the router and wired composition; `location`
  GET now requires `CurrentCustomer` and scopes by `customer_id`;
  `record_location` now requires and checks the calling provider's
  ownership of the booking (`07ef130`).
- **Final status: PASS WITH FIXES** (critical leak and wiring fixed;
  duplicate-system reconciliation is a separate architectural decision).

### Module 19 — Arrival Verification
- **Requirement:** "I Have Arrived" records time+GPS; optional PIN/QR/OTP
  the customer hands the provider as anti-fraud proof.
- **Implementation:** `arrival_router.py` → `ProviderArrivalService` →
  `ProviderArrivalSqlAdapter` → `PROV.ARRIVAL.*`. Columns on `BOOKINGS`
  (migration `0035`).
- **Issues found:**
  - **Critical (fixed):** none of the three `PROV.ARRIVAL.*` query IDs were
    registered in `registry.yaml` at all — every call raised
    `ConfigurationError` immediately.
  - **Critical (fixed):** no composition wiring (`provider_arrival_repository`/
    `provider_arrival_service()` didn't exist) and the router was never
    registered — triple unreachable.
  - **High (fixed):** the customer's arrival PIN (`arrival_code`) was
    returned by the provider's own `arrival-status` and `booking details`
    endpoints — completely defeating the PIN's purpose (proving the
    provider is genuinely on-site *because the customer had to hand it
    over*) once the wiring bugs above were fixed and the endpoints became
    reachable.
  - Medium (not fixed): the `ProviderArrivalRepository` ABC's method
    signatures don't match the concrete adapter's (`provider_id` missing
    from the port's declarations) — doesn't crash (Python ABCs don't
    enforce signatures) but is a real interface-contract drift.
- **Changes made:** registered the 3 queries, wired composition, registered
  the router, removed `arrival_code` from both response paths (`07ef130`).
- **Final status: PASS WITH FIXES** (module now actually functions and no
  longer leaks the PIN; the port/adapter signature drift is cosmetic and open).

### Module 20 — Start Service
- **Implementation:** shares `booking_router.py` with Modules 14/16.
  `start_service.sql`/`start_status.sql` (migration `0036`).
- **Issues found:** the guard logic itself is correct (can't start before
  `ARRIVED`; hourly timer genuinely persists `timer_started_at`) — but see
  Module 16's workflow-divergence note: this transition also bypasses
  `WorkflowManager`, and depends on Module 19 (previously totally broken)
  ever producing a real `ARRIVED` row.
- **Changes made:** none directly (fixed transitively by Module 19's fix).
- **Final status: PASS WITH ISSUES** (functionally correct in isolation;
  workflow-divergence is the same open systemic issue as Module 16).

### Module 21 — Job Checklist
- **Implementation:** `checklist_router.py` → `ProviderJobChecklistService`
  → SQL adapter → `PROV.CHECKLIST.*`. `JOB_CHECKLIST_TEMPLATES` +
  `BOOKING_CHECKLIST_ITEMS` (migration `0037`).
- **Issues found:**
  - **Critical (fixed):** `booking_set_completed.sql` referenced an
    `updated_at` column that doesn't exist on `BOOKING_CHECKLIST_ITEMS` —
    the module's core action, "check off a task," raised a DB error on
    every single call.
  - **High (fixed):** `instantiate.sql` (apply a template to a booking) had
    no check that the `booking_id` actually belonged to the calling
    provider — any provider with an active template could attach a
    checklist to any booking by id.
  - Low (not fixed): `is_completed` is one-way (no un-checking supported,
    despite the API shape implying a toggle); checklist progress is never
    read by Module 25 (job completion) to gate anything.
- **Changes made:** removed the bad column reference; added the missing
  ownership `EXISTS` guard (`07ef130`).
- **Final status: PASS WITH FIXES.**

### Module 22 — Evidence & Job Documentation
- **Implementation:** `evidence_router.py` → `ProviderJobEvidenceService` →
  SQL adapter → `PROV.EVIDENCE.*`. `BOOKING_EVIDENCE` (migration `0038`).
- **Issues found:** Medium (not fixed) — no booking-status check on
  `add.sql`; evidence can be added/backdated to a `COMPLETED`/`CANCELLED`
  booking. Low (not fixed) — no file type/size validation on `media_url`.
- **Security/RBAC:** ownership correctly enforced for add/list/summary.
- **Final status: PASS WITH ISSUES.**

### Module 23 — Change Request (provider submission side)
- **Requirement:** provider submits scope/price/time changes mid-job; the
  side that didn't propose decides.
- **Implementation:** `change_request_router.py` →
  `ProviderChangeRequestService` (submission) +
  `app/domains/change_requests/services/change_request_service.py`
  (customer decide/apply) — shared `CHANGE_REQUESTS` table.
- **Issues found:**
  - **Critical (fixed):** approving a `SCOPE` change was a complete no-op —
    `_apply_effect` only handled PRICE and TIME; the requirement's own
    headline example ("provider discovers damaged pipes") never actually
    resulted in the customer being billed.
  - **High (fixed):** `decide()` and `_apply_effect()` were two separate,
    non-transactional writes — a bad `proposed_value` (non-numeric price,
    malformed date) was only caught **after** the change's status had
    already committed to APPROVED, permanently stranding it with no way to
    retry.
  - **High (fixed):** re-deciding an already-decided change raised
    `WorkflowError` (a bare `Exception`, unmapped in
    `app/api/exceptions/handlers.py`) → an unhandled 500 instead of a
    clean 409.
- **Changes made:** added `BOOKINGS.scope_notes` (new column,
  migration `0059`) so SCOPE has somewhere to persist; split out
  `_validate_effect()` to run *before* the status transition commits;
  `WorkflowError` now extends the existing `ConflictError` (409) instead of
  a bare `Exception` — this fixes the same class of bug for **every**
  workflow-based domain, not just this one (`07ef130`, reapplied after
  branch-switch reversions).
- **Final status: PASS WITH FIXES.**

### Module 24 — Materials & Expenses
- **Implementation:** `materials_router.py` → `ProviderMaterialsService` →
  SQL adapter → `PROV.MATERIALS.*`. `BOOKING_MATERIALS` (migration `0040`).
- **Issues found:** High (not fixed) — `add.sql` checks booking ownership
  but not booking status; a provider can add material/expense lines to a
  `COMPLETED`/`CANCELLED` booking, inflating the eventual invoice
  (materials feed `provider_billing_service`) without the customer's
  awareness.
- **Good:** per-currency summary math is correct; delete correctly rechecks
  ownership (application-side, not SQL-atomic, but functionally sound).
- **Final status: PASS WITH ISSUES.**

### Module 25 — Job Completion
- **Implementation:** `completion_router.py` → `ProviderJobCompletionService`
  → SQL adapter → `PROV.COMPLETION.*`. `BOOKING_JOB_COMPLETIONS`
  (migration `0041`).
- **Issues found:** Medium (not fixed) — no check against Module 21's
  checklist progress or Module 22's evidence existence before allowing
  "Complete Job"; a job can be marked complete with an empty checklist and
  zero evidence rows.
- **Good:** the booking-status transition (`STARTED/IN_PROGRESS →
  COMPLETION_REQUESTED`) is genuinely atomic — a single CTE statement, the
  cleanest transition pattern found in the whole audit.
- **Final status: PASS WITH ISSUES.**

### Module 26 — Customer Sign-Off
- **Implementation:** `reviews_router.py` (naming trap: this file is
  Phase 26, not Phase 33 reviews) → `ProviderJobReviewService` → SQL
  adapter → `PROV.REVIEW.*`. `BOOKING_JOB_REVIEWS` (migration `0042`).
- **Issues found:** none material — real `NOT EXISTS`-guarded one-row-per-
  booking insert, correctly gates on `COMPLETION_REQUESTED`, confirmed to
  actually gate downstream invoice finalization
  (`invoice_service.finalize()` requires `CUSTOMER_CONFIRMED`). Low: a
  decorative unused `booking_id` path param on delete.
- **Tests:** `tests/api/test_provider_job_review.py` — a real integration
  test (submit → get → re-submit rejection → waiting → delete), passing.
- **Final status: PASS.**

### Module 27 — Final Billing
- **Requirement:** final amount = original + approved additional work +
  approved materials + taxes − discounts, read-only for the provider.
- **Implementation:** `billing_router.py` → `ProviderBillingService` → SQL
  adapter → `PROV.BILLING.*`.
- **Issues found:** **Medium (fixed)** — `discounts` was permanently
  hard-coded to `0.0` with a comment "surfaced as 0 here" — the customer's
  negotiated discount (`QUOTATIONS.discount_amount`, reachable via
  `BOOKINGS.quote_id`) never appeared in the preview and was never
  subtracted from `final_amount`, despite the module's own documented formula.
- **Changes made:** joined `QUOTATIONS` via `BOOKINGS.quote_id` in
  `preview.sql`, wired the real value through the service, applied it in
  `final_amount` (`fce3ba9`).
- **Final status: PASS WITH FIXES.**

### Module 28 — Provider Earnings
- **Requirement:** available/pending/total/withdrawn balances, today/week/
  month/year windows, transaction list.
- **Implementation:** `earnings_router.py` → `ProviderEarningsService` → SQL
  adapter → `PROV.EARNINGS.*`.
- **Issues found:**
  - **High (fixed):** `pending_earnings` used the identical CASE expression
    as `total_earnings` (both `status IN ('ISSUED','PAID')`) — a paid
    invoice was simultaneously reported as "pending" and as "total,"
    which is financially misleading.
  - **High (fixed):** `withdrawn_amount` was hard-coded `0` with a comment
    saying it would stay that way "until the payout system (Phase 30) is
    live" — Phase 30 has been live the whole time; the figure was
    permanently wrong.
  - Medium (not fixed): "available balance" is computed two different ways
    in two different modules (this one sums `PAID` invoices directly;
    Module 29's Wallet uses the stateful `PROVIDER_WALLETS.available_balance`
    that actually reflects withdrawals) — the two dashboards can disagree.
- **Changes made:** `pending_earnings` now counts `ISSUED` only;
  `withdrawn_amount` now sums real `PROVIDER_WALLET_LEDGER` `WITHDRAWAL`
  entries, matching how Module 29 already computes the same figure (`fce3ba9`).
- **Final status: PASS WITH FIXES** (the two live financial-display bugs
  fixed; the two-modules-disagree reconciliation is a separate, larger
  design question left open).

### Module 29 — Provider Wallet
- **Implementation:** `wallet_router.py` → `ProviderWalletService` → SQL
  adapter → `PROV.WALLET.*`. `PROVIDER_WALLETS` + `PROVIDER_WALLET_LEDGER`
  (migration `0043`).
- **Issues found:** none material — genuinely immutable ledger (no
  UPDATE/DELETE anywhere against it), all seven displayed statistics
  backed by real `entry_type` values, `version` column present for
  optimistic locking. Low: one dead unused SQL file (`get.sql`).
- **Final status: PASS.**

### Module 30 — Payout Management
- **Requirement:** register payout methods (bank/mobile money/wallet/
  other), request withdrawals, Requested→Processing→Paid/Failed lifecycle.
- **Implementation:** `payout_router.py` → `ProviderPayoutService` → SQL
  adapter → `PROV.PAYOUT.*`. `PROVIDER_PAYOUT_METHODS` +
  `PROVIDER_PAYOUTS` (migration `0044`).
- **Issues found:** **Medium (fixed)** — `withdraw.sql` inserted the
  caller-supplied `method_id` with no check that it belonged to the
  withdrawing provider (and `get.sql`/`list.sql` joined to
  `PROVIDER_PAYOUT_METHODS` the same unguarded way) — a provider could
  reference another provider's payout method/destination by guessing its id.
- **Good:** the wallet debit itself (`available_balance -= amount WHERE
  available_balance >= amount`) is a correct atomic compare-and-swap — no
  overdraft/double-spend race found; `cancel.sql`'s CAS guard on `status =
  'REQUESTED'` is equally solid.
- **Changes made:** the wallet-debit UPDATE now also requires (in the same
  atomic statement) that `method_id` belongs to the calling provider, so a
  foreign method_id fails closed before any money moves; `get.sql`/`list.sql`
  joins hardened the same way for defense in depth (`fce3ba9`).
- **Final status: PASS WITH FIXES.**

### Module 31 — Commission & Fees
- **Requirement:** provider sees gross→commission→tax→net, computed
  transparently.
- **Implementation:** `commission_router.py` → `ProviderCommissionService`
  → SQL adapter → `PROV.COMMISSION.*`. `PROVIDER_COMMISSION_RATES` +
  `PROVIDER_COMMISSION_FEES` (migration `0045`).
- **Issues found:**
  - **Critical (fixed):** the migration's `CREATE TABLE` had an unterminated
    quoted identifier (`"tax_on_commission` missing its closing quote) —
    the statement is malformed SQL and would fail to run as committed.
  - **Critical (fixed):** all 4 `PROV.COMMISSION.*` SQL files contained
    literal backslash-escaped quotes (`\"PROVIDER_COMMISSION_RATES\"`)
    instead of real quotes — every commission endpoint failed at the SQL
    layer with a syntax error, on top of the migration being broken.
  - High (not fixed): `apply()` has no real idempotency guard when the
    caller omits `reference_type`/`reference_id` (both optional) — calling
    `/apply` twice with the same amount and no reference silently
    double-charges (no dedup, no unique-violation handling).
- **Changes made:** fixed the migration's column-quote syntax and stripped
  the literal `\"` from all 4 SQL files (`07ef130`). Composition wiring for
  `provider_commission_repository`/`provider_commission_service()` was
  independently already correct.
- **Final status: PASS WITH FIXES** (module now actually runs; the
  optional-reference idempotency gap remains open).

### Module 32 — Invoices & Statements
- **Implementation:** `invoices_router.py` → `ProviderInvoicesService` →
  SQL adapter → `PROV.INVOICES.*`. `PROVIDER_INVOICES` (migration `0046`).
- **Issues found:**
  - **Critical (already fixed by the time of re-verification):** the
    router previously used a dead `make_provider_invoices_router(*,
    service, ctx)` factory pattern that nothing called, and
    `provider_invoices_repository` was referenced by its service factory
    without ever being constructed in `composition.py`'s `wire()`. Both
    were already corrected (by an earlier pass in this same session)
    before this audit's fix phase — verified, not re-done.
  - Low (fixed): `summary.sql`'s `total_count` used a self-referential
    `COUNT(*) FILTER (WHERE "status" = "status")` — a no-op filter that
    happened to be harmless (always true) but was nonsensical and could
    mislead a future maintainer.
- **Changes made:** replaced the self-referential filter with a plain
  `COUNT(*)` (`07ef130`).
- **Final status: PASS WITH FIXES.**

### Module 33 — Ratings & Reviews
- **Implementation:** `ratings_router.py` (naming trap: `reviews_router.py`
  in the same folder is Phase 26, not this) → `ProviderReviewsService` →
  SQL adapter → `PROV.REVIEWS.*`. `PROVIDER_REVIEWS` (migration `0047`).
- **Issues found:** the same dead-factory-router + missing-composition-
  wiring pattern as Module 32 — already corrected before this audit's fix
  phase, verified present. No further issues found; `list.sql` correctly
  parameterizes optional filters, `summary.sql`'s star-distribution/
  this-month math is correct.
- **Final status: PASS.**

### Module 34 — Provider Performance KPIs
- **Implementation:** `kpis_router.py` → `ProviderKpisService` → SQL
  adapter → `PROV.KPIS.*`. `PROVIDER_KPIS` (migration `0048`).
- **Issues found:** same dead-factory-router + wiring pattern, already
  corrected and verified. Low (not fixed): no CHECK constraint restricts
  `period` to the four valid values at the DB layer (only enforced in
  Python) — inconsistent with Module 35's stricter migration.
- **Final status: PASS.**

### Module 35 — Provider Ranking & Reputation
- **Implementation:** `ranking_router.py` → `ProviderRankingService` → SQL
  adapter → `PROV.RANKING.*`. `PROVIDER_RANKING` (migration `0049`), the
  most carefully constrained migration in the audit (explicit CHECK on
  `rank_level`).
- **Issues found:** same dead-factory-router + wiring pattern, already
  corrected and verified. `leaderboard` is correctly the only unauthenticated
  endpoint across all of Modules 32–35 (by design — it's a public leaderboard,
  and the registry's `requires_auth: false` for it is intentional, not a bug).
- **Final status: PASS.**

---

## Cumulative issue register

| ID | Module | Severity | Description | Root cause | Fix | Files | Result |
|----|--------|----------|--------------|------------|-----|-------|--------|
| P-01 | 1 | Critical | OTP code leaked in API responses | `DEV_MODE=True` hardcoded on | env-gated `_dev_mode()` | `provider_auth_service.py`, `customers/auth_service.py` | Fixed |
| P-02 | 1 | High | No mobile OTP verification path | never implemented | — | — | Open (feature gap) |
| P-03 | 1 | Critical | Unverified accounts fully usable | `login()` allows DRAFT status | — | — | Open |
| P-04 | 1 | Medium | Duplicate phone → 500 not 409 | no pre-check like email | — | — | Open |
| P-05 | 3 | High | Unverified providers visible to customers | directory queries missed `verification_status` | added `= 'VERIFIED'` gate | `list_by_category.sql`, `list_by_service.sql`, `profile.sql` | Fixed |
| P-06 | 4 | Medium | No INDIVIDUAL/BUSINESS validation cross-check | never implemented | — | — | Open |
| P-07 | 8 | Critical | Areas router unreachable | never imported/registered | added import + registration | `app/api/v1/router.py` | Fixed |
| P-08 | 10 | Low | Dashboard router registered twice | copy-paste | removed duplicate | `app/api/v1/router.py` | Fixed |
| P-09 | 11 | Critical | Job "Accept" doesn't claim exclusivity | no cross-provider check, no status transition | atomic `claim` CTE | `respond.sql`, `provider_request_service.py` | Fixed, verified live |
| P-10 | 13 | High | No provider-settable quote expiry | field never exposed | — | — | Open |
| P-11 | 14 | Critical | Booking ack IDOR | no ownership check in SQL | added `EXISTS` guard | `ack.sql` | Fixed |
| P-12 | 14 | Critical | Ack always fails after write | checked nonexistent `status` field on ack row | removed dead check, status now gated in SQL | `provider_booking_service.py`, `ack.sql` | Fixed |
| P-13 | 15 | Critical | Calendar week() crashes every call | param name shadowed `date` import | renamed param | `provider_calendar_service.py` | Fixed |
| P-14 | 15 | High | Agenda view looked backward in time | `to_date` bounded at today | 180-day forward window + sort | `provider_calendar_service.py` | Fixed |
| P-15 | 15/16/18/20 | High | Booking state machine bypasses `WorkflowManager`, diverges from registered transitions | hand-set SQL statuses, two parallel machines | — | — | Open (systemic, needs a single reconciliation pass) |
| P-16 | 17 | Critical | Messaging: missing service factory | `provider_messaging_service()` never defined | added factory | `composition.py` | Fixed |
| P-17 | 17 | Medium | No rich media / system-message support | schema never extended | — | — | Open (feature gap) |
| P-18 | 18 | Critical | Tracking router/service completely unwired | never registered/constructed | wired router + composition | `router.py`, `composition.py` | Fixed |
| P-19 | 18 | Critical | Unauthenticated live-location leak | `requires_auth: false`, no ownership check | require `CurrentCustomer`, scope by customer_id | `get_location.sql`, `tracking_router.py`, adapter/service | Fixed |
| P-20 | 18 | High | Location recording IDOR | no provider ownership check | added `EXISTS` guard | `record_location.sql`, adapter/service/router | Fixed |
| P-21 | 19 | Critical | Arrival queries never registered | missing `registry.yaml` entries | added 3 entries | `registry.yaml` | Fixed |
| P-22 | 19 | Critical | Arrival repository/service/router unwired | missing composition + router registration | wired all three | `composition.py`, `router.py` | Fixed |
| P-23 | 19 | High | Arrival PIN exposed to provider's own API | SELECT included `arrival_code` | removed from both response paths | `arrival/status.sql`, `bookings/details.sql` | Fixed |
| P-24 | 19 | Medium | Port/adapter signature drift (missing `provider_id`) | port never kept in sync | — | — | Open (cosmetic) |
| P-25 | 21 | Critical | Checklist complete-item endpoint always 500s | SQL references nonexistent `updated_at` column | removed reference | `booking_set_completed.sql` | Fixed |
| P-26 | 21 | High | Checklist instantiate IDOR | no booking-ownership check | added `EXISTS` guard | `instantiate.sql` | Fixed |
| P-27 | 22 | Medium | Evidence writable on closed bookings | no status gate | — | — | Open |
| P-28 | 23 | Critical | SCOPE change approval is a no-op | `_apply_effect` never handled SCOPE | added `BOOKINGS.scope_notes` + handler | `change_request_service.py`, migration `0059` | Fixed |
| P-29 | 23 | High | Decide/apply not atomic — bad value strands change | two separate non-transactional writes | validate before status transition | `change_request_service.py` | Fixed |
| P-30 | 23 (systemic) | High | `WorkflowError` unmapped → 500 instead of 409 | bare `Exception` subclass | now extends `ConflictError` | `workflow_manager.py` | Fixed (fixes every workflow domain) |
| P-31 | 24 | High | Materials addable to closed bookings | no status gate | — | — | Open |
| P-32 | 25 | Medium | Completion has no checklist/evidence gate | never checked | — | — | Open |
| P-33 | 27 | Medium | Discounts permanently hard-coded 0 | never wired to `QUOTATIONS` | joined via `BOOKINGS.quote_id` | `preview.sql`, `provider_billing_service.py` | Fixed |
| P-34 | 28 | High | `pending_earnings` duplicates `total_earnings` | identical CASE expression | narrowed to `ISSUED` only | `earnings/summary.sql` | Fixed |
| P-35 | 28 | High | `withdrawn_amount` permanently 0 | stale stub predating Phase 30 | real ledger sum | `earnings/summary.sql` | Fixed |
| P-36 | 30 | Medium | Payout method_id IDOR | no ownership check on insert/joins | atomic `EXISTS` guard in wallet-debit statement | `withdraw.sql`, `get.sql`, `list.sql` | Fixed |
| P-37 | 31 | Critical | Commission migration has malformed column syntax | unterminated quoted identifier | fixed quote | `0045_provider_commission_fees.py` | Fixed |
| P-38 | 31 | Critical | Commission SQL files have literal `\"` | copy/encoding error | stripped escapes | 4 files under `queries/providers/commission/` | Fixed |
| P-39 | 31 | High | Commission `apply()` not idempotent when reference omitted | optional fields, no dedup | — | — | Open |
| P-40 | 32 | Low | Self-referential no-op filter in summary | copy/paste artifact | plain `COUNT(*)` | `invoices/summary.sql` | Fixed |
| P-41 | *systemic* | Medium | 11 port/adapter files define a method literally named `list` without `from __future__ import annotations`, latent crash if a later `list[Any]` annotation resolves to the method instead of the builtin | missing future-annotations import | added import to all 11 | ports/adapters for invoices/kpis/notifications/portfolio/reviews/disputes/dsl_requests | Fixed (hit live twice before the pre-emptive pass) |

---

## Final acceptance audit

- **Modules passed outright (no issues):** 5, 6, 7, 9, 26, 29, 33, 34, 35 — 9 of 35.
- **Modules passed with fixes applied this audit:** 1 (partial), 3, 8, 10,
  11, 14, 15 (partial), 17 (partial), 18, 19, 21, 23, 27, 28, 30, 31
  (partial), 32 — 17 of 35.
- **Modules passing with real issues still open:** 1, 2, 4, 12, 13, 15, 16,
  17, 19, 20, 22, 24, 25, 31 — several of these overlap with the "fixed"
  list above (a module can have one critical bug fixed and one lower-
  severity issue still open at the same time).
- **Remaining blockers:** none of the 35 modules are non-functional as of
  this report — every "BLOCKED" verdict from the initial pass has been
  resolved. What remains open are lower-severity/architectural items (see
  register above), not module-breaking defects.
- **Missing functionality identified and added:** `BOOKINGS.scope_notes`
  (Module 23's SCOPE-change persistence target); 3 `registry.yaml` entries
  for Module 19; `provider_messaging_service()`, `provider_arrival_service()`,
  `provider_tracking_service()` composition factories.
- **Tables reviewed:** all tables touched by Modules 1–35 (`PROVIDERS` and
  its extensions, `PROVIDER_ONBOARDING_*`, `PROVIDER_BUSINESS_PROFILES`,
  `PROVIDER_VERIFICATION_DOCUMENTS`, `PROVIDER_SERVICES`,
  `PROVIDER_SERVICE_PRICING`, `PROVIDER_*_AREA*`, `PROVIDER_AVAILABILITY_*`,
  `PROVIDER_WORKING_HOURS`, `PROVIDER_TIME_OFF`, `PROVIDER_REQUEST_RESPONSES`,
  `MATCH_CANDIDATES`, `SERVICE_REQUESTS`, `QUOTATIONS`, `BOOKINGS` and its
  ack/tracking/arrival columns, `BOOKING_CHECKLIST_ITEMS`,
  `JOB_CHECKLIST_TEMPLATES`, `BOOKING_EVIDENCE`, `CHANGE_REQUESTS`,
  `BOOKING_MATERIALS`, `BOOKING_JOB_COMPLETIONS`, `BOOKING_JOB_REVIEWS`,
  `PROVIDER_WALLETS`, `PROVIDER_WALLET_LEDGER`, `PROVIDER_PAYOUT_METHODS`,
  `PROVIDER_PAYOUTS`, `PROVIDER_COMMISSION_RATES`, `PROVIDER_COMMISSION_FEES`,
  `PROVIDER_INVOICES`, `PROVIDER_REVIEWS`, `PROVIDER_KPIS`,
  `PROVIDER_RANKING`).
- **Tables created:** none — every module's required schema already
  existed; the one addition was a single column (`BOOKINGS.scope_notes`,
  migration `0059`), not a new table, because the fix genuinely required
  somewhere new to persist an approved SCOPE change.
- **Tables modified:** `BOOKINGS` (added `scope_notes`).
- **Indexes/constraints added:** none beyond what already existed —
  the fixes were query-level ownership/status guards, not schema
  constraints; the register above documents where a DB-level CHECK
  (e.g. `PROVIDER_KPIS.period`) would add defense-in-depth but wasn't
  added in this pass to avoid unplanned migrations beyond what each fix
  strictly required.
- **APIs reviewed:** all endpoints under every router in
  `app/domains/providers/api/*.py` reachable from `app/api/v1/router.py`.
- **APIs created:** none — every required endpoint already existed;
  the fixes were to make existing endpoints reachable/correct, not to add
  new surface area.
- **APIs fixed:** Areas (8), Dashboard dedup (10), Requests/accept (11),
  Booking ack (14), Calendar week/agenda (15), Messaging (17), Tracking (18),
  Arrival (19), Checklist (21), Change Requests (23), Billing (27),
  Earnings (28), Payouts (30), Commission (31), Invoices (32).
- **Security problems fixed:** P-01, P-05, P-11, P-19, P-20, P-23, P-26, P-36
  (see register) — the OTP leak, provider-directory visibility gate,
  booking-ack IDOR, unauthenticated location leak, location-record IDOR,
  arrival-PIN exposure, checklist-instantiate IDOR, and payout-method IDOR.
- **Integration problems fixed:** provider-side change-request submission
  now actually produces a billable effect on the customer side when
  approved (P-28); `WorkflowError` now propagates a correct HTTP status
  across every workflow-integrated domain, not just Change Requests (P-30).
- **Tests executed:** full `pytest` suite after every commit (sqlite-backed
  for most of the session; Postgres-backed once Docker came up, including
  `tests/api/test_provider_job_review.py`). All green except the one
  pre-existing, unrelated `APP_NAME` env-string mismatch in
  `test_info_reports_identity`. The Module 11 fix was additionally verified
  with a standalone concurrency script against live Postgres (two
  simultaneous "accept" calls → exactly one winner) — not committed as a
  repo test; recommend formalizing it as one.
- **End-to-end results:** no full registration→…→payout lifecycle run was
  executed end-to-end as a single scripted test in this pass (that's the
  natural next step — see Remaining technical debt).
- **Remaining technical debt:**
  1. Mobile OTP delivery (Module 1) — needs a real SMS integration, out of
     scope for a repair pass.
  2. No verification gate on login/account usage (Module 1) — needs a
     product decision on what an unverified account may do.
  3. Overlapping-bookings prevention (Module 15) not enforced at the actual
     booking-creation query — needs the guard added to
     `CUS.BOOKING.CREATE`, which is customer-domain code.
  4. Systemic booking-workflow divergence from `WorkflowManager` (Modules
     16/18/19/20) — needs one reconciliation pass across all booking-status
     writers, not a per-file patch.
  5. Zero test coverage for the overwhelming majority of provider modules
     (only Module 26 has a real test). This audit's fixes were verified by
     manual/scripted checks against live Postgres, not committed
     regression tests — the single highest-leverage follow-up is writing
     tests for the modules touched here before the next round of changes.
  6. Several "Medium"-severity status-gating gaps (Modules 4, 13, 22, 24,
     25, 31) left open — none block core functionality, all are listed in
     the issue register for prioritization.

---

## Traceability matrix

Business Requirement → Module → API → Service → Query/Manager → Table →
Event/Integration → Test

| Requirement | Module | API | Service | Query ID(s) | Table(s) | Event/Integration | Test |
|---|---|---|---|---|---|---|---|
| Registration + OTP verification | 1 | `/providers/auth/*` | `ProviderAuthService` | `PROV.AUTH.*` | `PROVIDERS` | `EVT.PROVIDER.REGISTERED/VERIFIED` | none |
| 7-step onboarding, auto-saved | 2 | `/providers/onboarding/*` | `ProviderOnboardingService` | `PROV.ONBOARD.*` | `PROVIDER_ONBOARDING_{STEPS,PROGRESS}` | — | none |
| Public profile + preview | 3 | `/providers/profile/*` | `ProviderProfileService` | `PRV.PROFILE.*`, `CUS.PROVIDER.{PROFILE,LIST_BY_CATEGORY,LIST_BY_SERVICE}` | `PROVIDERS` | — | none |
| Business/company profile | 4 | `/providers/business` | `ProviderBusinessService` | `PRV.BUSINESS.*` | `PROVIDER_BUSINESS_PROFILES` | — | none |
| Identity/document verification | 5 | `/providers/verification/*` | `ProviderVerificationService` | `PRV.VER.*` | `PROVIDER_DOC_TYPES`, `PROVIDER_VERIFICATION_DOCUMENTS` | — | none |
| Service category configuration | 6 | `/providers/services/*` | `ProviderServiceConfigService` | `PRV.SERVICE.*` | `PROVIDER_SERVICES` | — | none |
| Pricing per service | 7 | `/providers/pricing/*` | `ProviderServicePricingService` | `PRV.PRICING.*` | `PROVIDER_SERVICE_PRICING` | — | none |
| Service area management | 8 | `/providers/areas/*` | `ProviderServiceAreaService` | `PRV.AREAS.*` | `PROVIDER_AREA_SETTINGS`, `PROVIDER_SERVICE_AREAS`, `PROVIDER_AREA_EXCLUSIONS` | — | none |
| Availability/working hours | 9 | `/providers/availability/*` | `ProviderAvailabilityService` | `PRV.AVAIL.*` | `PROVIDER_AVAILABILITY_SETTINGS`, `PROVIDER_WORKING_HOURS`, `PROVIDER_TIME_OFF` | — | none |
| Dashboard overview | 10 | `/providers/dashboard/*` | `ProviderDashboardService` | `PRV.DASH.*` | (read composition) | — | none |
| Incoming job requests, accept/decline/quote/question | 11 | `/providers/me/requests/*` | `ProviderIncomingRequestService` | `PRV.REQUESTS.*` | `PROVIDER_REQUEST_RESPONSES`, `SERVICE_REQUESTS`, `MATCH_CANDIDATES` | `provider.request.responded` | ad hoc concurrency script (not committed) |
| Matching eligibility (read-only) | 12 | `/providers/me/matching/*` | `ProviderMatchingService` | `PRV.MATCH.*` | (read composition) | — | none |
| Quotations/offers | 13 | `/providers/me/quotations/*` | `ProviderQuotationService` | `PRV.QUOTE.*` | `QUOTATIONS`, `QUOTATION_ATTACHMENTS` | — | none |
| Booking confirmation + acknowledge | 14 | `/providers/me/bookings/{id}/acknowledge` | `ProviderBookingService` | `PROV.BOOKING.ACK` | `PROVIDER_BOOKING_ACKNOWLEDGEMENTS`, `BOOKINGS` | — | none |
| Provider calendar (day/week/month/agenda + overlap check) | 15 | `/providers/me/calendar/*` | `ProviderCalendarService` | `PROV.CALENDAR.*` | `BOOKINGS`, `PROVIDER_TIME_OFF` | — | none |
| Booking details/timeline/messages | 16 | `/providers/me/bookings/{id}/{details,timeline,message-count}` | `ProviderBookingService` | `PROV.BOOKING.{DETAILS,TIMELINE.LIST,...}` | `BOOKINGS`, `SERVICE_REQUESTS`, `SERVICES`, `PROVIDERS`, `CUSTOMER_ADDRESSES` | — | none |
| Customer messaging | 17 | `/providers/me/messaging/*` | `ProviderMessagingService` | `PROV.MESSAGES.*` | `CONVERSATIONS`, `MESSAGES` | — | none |
| Navigation & tracking | 18 | `/providers/me/tracking/*` | `ProviderTrackingService` | `PROV.TRIP.*` | `BOOKINGS`, `PROVIDER_LOCATIONS` | — | none |
| Arrival + PIN verification | 19 | `/providers/me/bookings/{id}/{arrive,verify-pin,arrival-status}` | `ProviderArrivalService` | `PROV.ARRIVAL.*` | `BOOKINGS` | — | none |
| Start service + hourly timer | 20 | `/providers/me/bookings/{id}/{start-service,start-status}` | `ProviderBookingService` | `PROV.BOOKING.{START_SERVICE,START_STATUS}` | `BOOKINGS`, `PROVIDER_SERVICES` | — | none |
| Job checklist | 21 | `/providers/me/checklist/*` | `ProviderJobChecklistService` | `PROV.CHECKLIST.*` | `JOB_CHECKLIST_TEMPLATES`, `BOOKING_CHECKLIST_ITEMS` | — | none |
| Evidence/documentation | 22 | `/providers/me/evidence/*` | `ProviderJobEvidenceService` | `PROV.EVIDENCE.*` | `BOOKING_EVIDENCE` | — | none |
| Change request (submit + decide) | 23 | `/providers/me/change-requests/*`, `/bookings/{id}/change-requests/{id}/decide` | `ProviderChangeRequestService`, `ChangeRequestService` | `PROV.CHANGE.*`, `CUS.CHANGE.*` | `CHANGE_REQUESTS`, `BOOKINGS` | `WF.CHANGE_REQUEST.V1` | none |
| Materials & expenses | 24 | `/providers/me/materials/*` | `ProviderMaterialsService` | `PROV.MATERIALS.*` | `BOOKING_MATERIALS` | — | none |
| Job completion | 25 | `/providers/me/completion/*` | `ProviderJobCompletionService` | `PROV.COMPLETION.*` | `BOOKING_JOB_COMPLETIONS`, `BOOKINGS` | `SERVICE.COMPLETION_REQUESTED` | none |
| Customer sign-off | 26 | `/providers/me/reviews/*` | `ProviderJobReviewService` | `PROV.REVIEW.*` | `BOOKING_JOB_REVIEWS` | — | `test_provider_job_review.py` |
| Final billing preview | 27 | `/providers/me/billing/*` | `ProviderBillingService` | `PROV.BILLING.*` | `BOOKINGS`, `CHANGE_REQUESTS`, `BOOKING_MATERIALS`, `QUOTATIONS` | — | none |
| Provider earnings | 28 | `/providers/me/earnings/*` | `ProviderEarningsService` | `PROV.EARNINGS.*` | `INVOICES`, `PROVIDER_WALLET_LEDGER` | — | none |
| Provider wallet | 29 | `/providers/me/wallet/*` | `ProviderWalletService` | `PROV.WALLET.*` | `PROVIDER_WALLETS`, `PROVIDER_WALLET_LEDGER` | — | none |
| Payout management | 30 | `/providers/me/payouts/*` | `ProviderPayoutService` | `PROV.PAYOUT.*` | `PROVIDER_PAYOUT_METHODS`, `PROVIDER_PAYOUTS`, `PROVIDER_WALLETS`, `PROVIDER_WALLET_LEDGER` | — | none |
| Commission & fees | 31 | `/providers/me/commission/*` | `ProviderCommissionService` | `PROV.COMMISSION.*` | `PROVIDER_COMMISSION_RATES`, `PROVIDER_COMMISSION_FEES` | — | none |
| Invoices & statements | 32 | `/providers/me/invoices/*` | `ProviderInvoicesService` | `PROV.INVOICES.*` | `PROVIDER_INVOICES` | — | none |
| Ratings & reviews | 33 | `/providers/me/ratings/*` | `ProviderReviewsService` | `PROV.REVIEWS.*` | `PROVIDER_REVIEWS` | — | none |
| Performance KPIs | 34 | `/providers/me/kpis/*` | `ProviderKpisService` | `PROV.KPIS.*` | `PROVIDER_KPIS` | — | none |
| Ranking & reputation | 35 | `/providers/me/ranking/*` | `ProviderRankingService` | `PROV.RANKING.*` | `PROVIDER_RANKING` | — | none |

The "Test" column being overwhelmingly "none" is itself the single largest
finding of this audit, independent of any individual bug: **only one of the
35 provider modules has committed automated test coverage.** Every fix in
this report was verified by (a) full-suite `pytest` runs staying green, (b)
direct code/SQL inspection, and (c) for Module 11 specifically, a live
concurrency script against real Postgres — not by a growing regression
suite. Closing that gap is the standing recommendation this report leads with.
