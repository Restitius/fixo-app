<!-- .github/pull_request_template.md -->
## What and why

Ticket: FIXO-___

## Git promotion validation

<!-- Required route: fix/feature -> page -> module -> dev -> staging -> main.
Check only completed validation levels and replace the evidence placeholder. -->

- [ ] Fix validation complete
- [ ] Page validation complete
- [ ] Module validation complete
- [ ] Staging validation complete

Validation evidence:

<!-- Add test commands/results or links after the colon above. Reviewers must verify them. -->

<!-- What changes, and what problem it solves. Two or three sentences. -->

## Risk tier

- [ ] Tier 1 — presentation only
- [ ] Tier 2 — business-critical domain
- [ ] Tier 3 — security, financial, infrastructure or migration

## Checks the author confirms

- [ ] No secret, key or credential added to the repository or to a test fixture
- [ ] New endpoints enforce authentication and ownership (`get_current_customer` / `get_current_provider`)
- [ ] Domain services reach the database only through governed queries (`app/queries/` + `app/registries/queries/`)
- [ ] External providers are called only through an Integration Manager (`app/integrations/external/`)
- [ ] New environment variables added to `applications/backend/.env.example` and to the secret store
- [ ] Logs contain no phone numbers, tokens, signatures or payment identifiers

## Database migration

- [ ] No migration in this change
- [ ] Migration is expand-only (additive, backward compatible)
- [ ] Migration is destructive — rollback plan below is mandatory

### Rollback plan

<!-- How production returns to the previous state: image tag, data loss, time window. -->

## How this was verified

<!-- Staging evidence: what you exercised, what you observed. -->
