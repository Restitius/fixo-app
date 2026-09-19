# Runbook: Exposed Credential

Trigger: `security.yml`'s `secrets` job (gitleaks) flags a committed secret,
or a credential is otherwise found exposed (leaked log, shared screenshot,
compromised laptop).

## 1. Contain (minutes, not hours)

1. Identify exactly which credential leaked and where (commit SHA, log line,
   channel). Do not wait for step 2 to start this.
2. Revoke/rotate at the source system immediately — see the per-credential
   table below. Revocation always comes before history cleanup: a secret
   still live in git history is only dangerous while it's still valid.

## 2. Rotate

| Credential | Where it's configured | Rotation steps |
|---|---|---|
| `SWALA_SMS_API_KEY` | Swala SMS dashboard; `credentials_key="SWALA_SMS"` (`applications/backend/app/startup/register_integrations.py`, `INT.SMS.TRANSACTIONAL.V1`) | 1. Generate a new key in the Swala dashboard (do not delete the old one yet). 2. Update `SWALA_SMS_API_KEY` in the target environment's secret store (GitHub Environment secret for staging/production — see `deploy-staging.yml`/`deploy-production.yml`'s `sms-key-guard` job for the exact secret name). 3. Redeploy (or restart) so the new key is loaded — this app reads it once at startup via `app.config.get_settings()`, not per-request. 4. Confirm inbound webhooks still verify: `SWALA_SMS_WEBHOOK_SECRET` is a *separate* credential — rotate it too only if it was also exposed. 5. Revoke the old key in the Swala dashboard once the new one is confirmed working (`tests/security/test_sms_integration_rules.py` / `test_webhook_verification.py` cover the shape this should keep). |
| `SWALA_SMS_WEBHOOK_SECRET` | Swala dashboard webhook config; consumed via `application.state.swala_sms_webhook_secret` (`app/startup/application.py`) and checked in `app/integrations/external/webhooks/router.py` | 1. Generate a new shared secret in the Swala webhook config. 2. Update the env var + redeploy. 3. Update the same value on Swala's side so both ends agree — a mismatch here fails every inbound webhook closed (safe failure mode, but a real outage until fixed). |
| `PRIMARY_DB_URL` (inline password) | `.env` / GitHub Environment secret | 1. Rotate the database user's password at the database. 2. Update the secret. 3. Redeploy — `DatabaseManager` engines are created once at startup (`app/bootstrap.py::_initialize_database`), so existing connections are unaffected until restart, but no new connections will succeed with the old password once rotated at the DB. |
| `GITHUB_TOKEN` (Actions-issued) | N/A — short-lived, auto-rotated per workflow run | Nothing to do; it already expires. If a *personal* GitHub token leaked instead, revoke it in GitHub Settings > Developer settings > Tokens immediately. |
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard > API Tokens; GitHub repo secret | 1. Revoke the token in the Cloudflare dashboard (immediate — Cloudflare tokens are bearer credentials with no separate revoke-old-after-new-works step needed). 2. Create a new token scoped to `Workers Scripts:Edit` for this account only. 3. Update the `CLOUDFLARE_API_TOKEN` repo secret. |
| `cosign` signing identity | N/A — keyless OIDC, no long-lived key material to leak | Nothing to rotate; this is the reason `build.yml` uses keyless signing instead of a stored private key. |

## 3. Clean history (only after rotation is confirmed live)

```bash
# Confirm the leaked value's current exposure across history (rotation
# already made it worthless — this count is just for the incident record):
git log --all -p | grep -c 'the-leaked-value'

# Use git-filter-repo (not filter-branch) to strip it from history:
git filter-repo --replace-text <(echo 'the-leaked-value==>REDACTED')
```

Rewriting shared branch history is disruptive (every clone/fork needs a hard
reset) — coordinate with the team before force-pushing a rewritten `main` or
`dev`. In most cases, rotation alone (making the leaked value worthless) is
sufficient and history rewriting is optional cleanup, not a blocking step.

## 4. Post-incident

- Add the specific credential's committed form to `.gitleaks.toml`'s rules
  if it wasn't already caught (check why the scan missed it, if it did).
- Confirm `security/allowlists/dependency-exceptions.yml` wasn't the cause
  (an allowlisted path shouldn't overlap with real credential locations).
- Write down what happened and the timeline while it's fresh — this table
  is the reference for *how* to rotate; a short incident note is the
  record of *what actually happened this time*.
