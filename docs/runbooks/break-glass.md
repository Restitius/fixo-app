# Runbook: Break-Glass Production Change

For when `pr-checks.yml` / `security.yml` / the `production` Environment's
required-reviewer gate genuinely cannot be waited on — an active incident
where the normal path is itself the blocker. This is not a way to skip
review because it's inconvenient; it's logged and reviewed after the fact
specifically because it bypasses the controls those workflows enforce.

## When this applies

- Production is down or materially degraded *right now*, and the fix is
  known but blocked by CI turnaround time, a required check that's
  unrelated to the incident (e.g. a flaky frontend build job unrelated to
  a backend hotfix), or reviewer unavailability.
- Does NOT apply to: routine urgency ("the client wants this today"),
  avoiding an inconvenient finding from `security.yml`, or a migration
  someone doesn't want to wait on `scripts/check-migration-safety.py` for.
  Those go through the normal pipeline.

## Procedure

1. **Say so, before acting.** Post in the team's incident channel: what's
   broken, what the fix is, why the normal path can't be used right now.
   This step is the actual control — a break-glass change with no prior
   announcement is indistinguishable from an unauthorized one after the
   fact.
2. **Get one other person's explicit yes** — even in a live incident, one
   other engineer confirms the diagnosis and the fix before it ships. Solo
   break-glass changes are the ones most likely to make an incident worse.
3. **Make the smallest possible change.** Break-glass is for stopping the
   bleeding, not shipping the full fix — a minimal revert or a targeted
   patch, not a larger change that happens to also fix the root cause.
4. **Bypass only what's blocking**, nothing else:
   - A required GitHub Environment reviewer can approve directly in the
     Environment's pending-deployment UI — this still requires a human
     approval, just not the normal on-call rotation's specific reviewer.
   - If a repository admin must temporarily disable branch protection on
     `main` to push a hotfix directly: do it, push the fix, **re-enable
     branch protection immediately after** (`security/policies/main-ruleset.json`
     is the config to reapply — see Phase 1's `gh api` command for
     applying it).
   - Never disable `security.yml`'s secret scanning or `pr-checks.yml`'s
     architecture job as part of a break-glass change — those catch
     mistakes made *faster* under incident pressure, which is exactly
     when they matter most.
5. **Deploy the minimal fix** through whatever path is fastest and still
   produces a real, traceable artifact — ideally still through
   `deploy-production.yml` (manually triggered / reviewer-approved), not a
   hand-run `docker push` from a laptop. If even that's unavailable,
   document exactly what was pushed and how in step 6.
6. **File the retroactive record within 24 hours**, whichever is sooner:
   - What broke, what was bypassed and why, who approved it (step 2).
   - The actual diff that shipped (link the commit/PR even if it merged
     after the fact).
   - Whether branch protection was disabled and re-enabled, and exact
     timestamps.
   - A normal PR that brings the change through the full pipeline
     properly (tests, architecture rules, migration safety) — the
     break-glass change is a stopgap, not the final form of the fix.
7. **Re-run the full pipeline against `main` retroactively** — trigger
   `pr-checks.yml`/`security.yml` against what actually shipped, not just
   the follow-up PR, so any gap the bypass introduced is caught before it's
   forgotten.

## What "logged and reviewed" means concretely

The retroactive record (step 6) is reviewed at the next team sync, same as
a postmortem. Repeated break-glass use for the same class of problem (e.g.
"the frontend build job is flaky so we keep bypassing it") means the
underlying gate needs fixing, not that bypassing it is now normal.
