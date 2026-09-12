# FIXO User (Customer) Frontend — Implementation Roadmap

> Tracks closing the gap between the **User Business Requirements** (50
> modules) and `applications/frontend/web/web-user`. Unlike the provider
> roadmap, this is **not backend-building** — every endpoint below already
> existed, fully wired, from the original baseline commit
> (`app/domains/{onboarding,properties,assets,maintenance,warranties,
> recurring,disputes,change_requests}`, all `include_router`'d in
> `app/api/v1/router.py`). Each row here is a `web-user` route + i18n +
> nav gap being closed, occasionally with a small additive backend fix
> (e.g. widening a SELECT) where the existing query didn't expose enough.
>
> **Conventions (same house structure as the provider roadmap):**
> - One page branch per phase `page/user-<slug>` (forked from
>   `module/user-account`) → merged into `module/user-account`
>   (`merge: page/user-<slug> into module/user-account`) →
>   `module/user-account` merged into `dev` (`merge: module/user-account
>   into dev (<short summary>)`).
> - One implementation commit per phase (occasionally batched); tags
>   `user-phaseN-v1` on the phase's page branch where warranted.
> - Verification per phase: `cd applications/backend && python -m pytest`
>   stays green; `cd applications/frontend/web/web-user && npx tsc --noEmit`
>   clean; all 10 locale JSON files parse; browser-verified against the
>   real dev server with a real test account.
> - 2FA (Module 46, part of Profile/Security) is **explicitly deferred** —
>   zero backend exists for it and it's a security-sensitive feature in
>   its own right, not a wiring gap. Left as an honest "not available yet"
>   in the UI.

## Requirement modules → implementation phases

| Impl | Req module | Scope | Status |
|------|-----------|-------|--------|
| USR-03 | Module 03 | Customer Onboarding — checklist (verify contact / set location / add property), gated in `__root.tsx` | ✅ done (commit `4452165`) |
| USR-24 | Module 24 | Change Request Approval — approve/decline a provider-proposed change on a booking | ✅ done (commit `e502aae`) |
| USR-06 | Module 06 | Properties — CRUD + room management | ⏳ next |
| USR-32 | Module 32 | Property Assets — simplified UI against the generic `/assets` domain (no property linkage yet — disclosed) | ⏳ |
| USR-33 | Module 33 | Maintenance — plans tied to an asset + service | ⏳ |
| USR-29 | Module 29 | Warranty — list + claim | ⏳ |
| USR-31 | Module 31 | Recurring Services — subscription create/list/pause/resume/cancel | ⏳ |
| USR-39 | Module 39 | Disputes — list/get/evidence/withdraw (open already existed via `bookingApi.openDispute`) | ⏳ |
| USR-43a | Module 43 | Profile field editing — wire "Edit Profile" to `PATCH /auth/me` (full_name, phone; date_of_birth needs a new migration) | ⏳ |
