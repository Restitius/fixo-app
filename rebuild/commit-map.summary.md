# Reconstruction Matrix Summary

Source revision: `dev`
Non-merge commits: **281** | Merges: **304**

## Commit status

| status | count |
| --- | --- |
| ok | 247 |
| needs_split | 23 |
| overridden | 10 |
| needs_review | 1 |

## Resulting surface (new_scope)

| scope | count |
| --- | --- |
| provider | 66 |
| customer-web | 58 |
| backend | 50 |
| provider-mobile | 27 |
| provider-web | 26 |
| customer-mobile | 16 |
| repo | 5 |
| cicd | 4 |
| shared-web | 4 |
| shared-mobile | 1 |

## Merge kinds

| kind | count |
| --- | --- |
| page->module | 153 |
| module->dev | 142 |
| other | 9 |

## Legacy scopes still present

Count: **82**

- `5b71a1dc` `feat(provider-app): add Subscription screen (final of 6 backend-gap domains)`
- `e559d8a1` `feat(web-provider): add Subscription screen (final of 6 backend-gap domains)`
- `b9d37bc0` `fix(provider-app): add scrolling to Sheet/CenterModal, add Promotions screen`
- `7448acfe` `feat(mobile): add the real Equipment screen with full CRUD + assign/retire`
- `fd2b573b` `feat(mobile): add the real Job Assignments screen`
- `4bbbc28d` `feat(web-provider): add the real Promotions screen`
- `edfa4613` `feat(web-provider): add the real Equipment screen`
- `13f96189` `feat(web-provider): add the real Job Assignments screen`
- `4d8e75d9` `feat(mobile): add the real Disputes screen`
- `29d2febd` `feat(mobile): add the real Safety screen, wire it into Support and Profile`
- `72b3001b` `feat(mobile): add the real Support screen with ticket thread`
- `83ecbc86` `feat(web-provider): add the real Disputes screen`
- `46af85c2` `feat(web-provider): add the real Safety screen, wire it into Support`
- `26327660` `feat(web-provider): wire Support to real tickets + message thread`
- `d93295b9` `feat(mobile): add the real Customers screen (business-customer CRUD)`
- `6481b067` `feat(mobile): add the real Team screen with full CRUD + deactivate`
- `7457ccaf` `feat(web-provider): wire Customers to real business-customer CRUD`
- `e0ac4dc6` `feat(web-provider): wire Team to real member CRUD, drop 3 unrelated panels`
- `df575152` `feat(mobile): add the real Portfolio screen with full CRUD`
- `d9003f76` `feat(mobile): add the real Reviews screen (ratings_router, not reviews_router)`
- `ca8d072a` `feat(mobile): add the real Performance screen (ranking + KPI history)`
- `fa03c84f` `feat(web-provider): wire Portfolio to real CRUD, add postRaw/patchRaw/deleteRaw`
- `29f14524` `feat(web-provider): wire Reviews to the real ratings domain, drop the reply UI`
- `83c71c43` `feat(web-provider): wire Performance to real ranking + KPI data`
- `8616cbe2` `feat(mobile): add the real Earnings screen, fix the same raw-envelope gap`
- `f3237ce1` `feat(mobile): build the real Notifications feed, wire the dead bell button`
- `d0d986f9` `feat(web-provider): wire Earnings to the real backend, drop fabricated panels`
- `ecbb3d5b` `feat(web-provider): wire Notifications' two side panels to real data`
- `3bf7082b` `feat(mobile): build the real Messages screen — a genuinely missing feature`
- `b6a3e610` `fix(mobile): persistent labels on the two remaining placeholder-only forms`
- `790c02f4` `fix(mobile): persistent field labels everywhere, extract shared Field`
- `44737cb6` `fix(mobile): today-marker on calendar, tab-header consistency, service-name display`
- `3383e9e9` `fix(mobile): equalize MetricCard row heights, humanize raw enum codes`
- `32eaeb67` `fix(mobile): use the real registered client ids in provider-app`
- `7500b943` `feat(mobile): build the 7-step provider onboarding wizard`
- `cd69fd4d` `feat(mobile): profile hub, business, pricing, services, areas, documents, settings (Sub-phase M-G)`
- `9035bd3c` `feat(mobile): wallet, payouts, and invoices (Sub-phase M-F)`
- `81cc7775` `feat(mobile): calendar and availability (Sub-phase M-E)`
- `687a16be` `feat(mobile): requests, quotes, and full booking execution (Sub-phase M-D)`
- `80d9ba45` `feat(mobile): build the real provider Dashboard screen (Sub-phase M-C)`

## Needs ruling (24)

- `d0744fbc` [needs_split] `docs(repo): restore governance policy docs and CI gate lost in the history restore` -> surfaces: backend,cicd,repo ()
- `7457ccaf` [needs_split] `feat(web-provider): wire Customers to real business-customer CRUD` -> surfaces: backend,provider-web (legacy scope)
- `5f545ff0` [needs_split] `feat(web-provider): wire provider registration and OTP verification to the real backend` -> surfaces: customer-web,provider-web (legacy scope)
- `e2fc58d0` [needs_split] `feat(cicd): Phase 8 — deploy-production.yml, blue/green, rollback, runbooks` -> surfaces: cicd,repo ()
- `09beafa6` [needs_split] `feat(cicd): Phase 6 — build.yml, hardened Dockerfile, signed artifacts` -> surfaces: backend,cicd ()
- `5cf1fde3` [needs_split] `chore(backend): apply ruff --fix auto-corrections repo-wide` -> surfaces: backend,customer-web,provider-web ()
- `b5ea7c76` [needs_split] `feat(cicd): Phase 1 — branch protection, secret scanning, credential hygiene` -> surfaces: cicd,repo ()
- `621b6d81` [needs_split] `feat(frontend): real provider auth/notifications/messages, unread badges` -> surfaces: cicd,customer-mobile,customer-web,provider-web (legacy scope)
- `d47388ee` [needs_split] `fix(user): correct property assets to match real ASSETS schema (USR-06, USR-32)` -> surfaces: backend,customer-web ()
- `65517457` [needs_split] `feat(user): Phase 8 - approve/decline provider change requests (USR-24)` -> surfaces: backend,customer-web ()
- `26c53e03` [needs_split] `Wire client attribution headers into web-user, mobile and web-provider clients` -> surfaces: customer-mobile,customer-web,provider-web (client attribution headers touch customer-web + customer-mobile + provider-web (R4))
- `56749f43` [needs_split] `Add client attribution unit and integration tests` -> surfaces: backend (client attribution tests span multiple surfaces (R4))
- `8e8ce8c8` [needs_review] `fix(i18n): make English the true default, not device/browser locale` -> surfaces: customer-mobile,customer-web (i18n default locale spans web + mobile: shared-web, shared-mobile, or split)
- `85aa389a` [needs_split] `feat(services): rebuild Services + Providers end to end on real catalog/provider data` -> surfaces: backend,customer-web ()
- `f1ef93b5` [needs_split] `feat(activity): rebuild to match reference exactly — category-based dialog/panel split, real timeline writes` -> surfaces: backend,customer-web ()
- `aee8abf0` [needs_split] `feat(help): rebuild to match reference exactly — ticket detail panel, real derived timeline, fixed category bug` -> surfaces: backend,customer-web ()
- `09a2591c` [needs_split] `feat(feedback): rebuild to match reference exactly — rating dialog, review details, real bulk ratings endpoint` -> surfaces: backend,customer-web ()
- `e432c75e` [needs_split] `feat(profile): rebuild all 6 Settings tabs to match reference images exactly` -> surfaces: backend,customer-web ()
- `c8a75f25` [needs_split] `feat(promotions): rebuild to match reference exactly — stat cards, details panel, real ledger` -> surfaces: backend,customer-web ()
- `d5f54bde` [needs_split] `fix(invoices): implement exact reference layout — paid dialog, pending squeeze panel` -> surfaces: backend,customer-web ()
- `64701d34` [needs_split] `feat(invoices): redesign to match reference, add real Service/Provider columns` -> surfaces: backend,customer-web ()
- `eb08820a` [needs_split] `feat(invoices): new Invoices page with expandable line-item detail` -> surfaces: backend,customer-web ()
- `08a05926` [needs_split] `feat(payments): new Payments page wired to real payment methods + charge history` -> surfaces: backend,customer-web ()
- `77f8fe35` [needs_split] `chore: initial commit - FIXO-APP monorepo baseline` -> surfaces: backend,cicd,customer-mobile,customer-web,repo ()
