# History rebuild: 2026-09-19

The repository owner explicitly authorized replacing the historical graph with
fresh commits. This is a one-time migration, not the normal development workflow.

## Scope and preservation

- Source: the complete current FIXO checkout, including previously uncommitted
  Git workflow changes, the owner's staging policy, and the local launch config.
- Fresh commits separate repository governance, backend code and database
  migrations, backend tests/documentation, and the four frontend applications.
- Integration follows `feature/history-rebuild -> page/repository-workflow ->
  module/repository-governance -> dev`. Temporary integration branches are
  removed only after their commits are reachable from dev.
- `main` retains the existing GitHub production baseline's README content;
  `staging` starts at that same baseline. Development code must not be promoted
  until the staging requirements in `applications/backend/docs/git-staging.md`
  have actually been met.
- All original refs, tags, stash reflogs, and Git objects are preserved in a
  separate local recovery backup. Original ref IDs are inventoried separately.
- Seven old page branches have patch-equivalent changes already in dev.
- Nine stashes and the unique `wip/mixed-phase20-maps` changes are retained as
  recovery patches on a temporary recovery branch. These are historical work,
  not approved application changes. Review individual hunks against current
  source; never apply all patches or merge old snapshots wholesale.

## Validation performed

- Fresh PostgreSQL database upgraded successfully through Alembic revision 0073.
- Backend pytest suite exited successfully against that isolated database;
  data-dependent tests skipped where customer/provider fixtures were absent.
- TypeScript checks passed for web-user, web-provider, user-app, and provider-app.
- Production builds passed for both web applications.
- Regenerated web route trees, including missing user password-reset routes.
- Replaced 64 CI action placeholder references with verified upstream SHAs.
- File manifests and Git tree comparisons verify that the reimport retains the
  complete selected source. These checks establish migration fidelity, not
  production acceptance or full functional coverage.

## Outstanding release gates

The repository has no configured GitHub staging/production environments, and
the backend deployment implementation still contains infrastructure placeholders.
The staging artifact lookup and production exact-SHA preflight also need a
validated deployment design. Do not claim successful deployment from these
workflows until those gaps are resolved.

Seeded security/integration tests, native mobile runtime testing, full QA/UAT,
performance validation, and deployment verification remain required before
promoting the rebuilt development snapshot through staging to main. Migration
tags identify snapshots; they are not production release tags.
